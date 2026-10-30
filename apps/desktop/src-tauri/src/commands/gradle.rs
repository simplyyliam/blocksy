//! Runs the project's Gradle wrapper (build, runClient, clean) and streams its output.
//! Only one task runs at a time: Loom tasks share files and can't overlap.

use std::path::{Path, PathBuf};
use std::process::Stdio;
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::Mutex;

use serde::Serialize;
use specta::Type;
use tauri::{AppHandle, Manager, State};
use tauri_specta::Event;
use tokio::io::{AsyncBufReadExt, AsyncRead, BufReader};

use crate::error::{AppError, AppResult, ErrorCode};
use crate::events::{GradleFinished, GradleOutput, GradleTask, OutputStream};
use crate::process::{kill_tree, quiet_async_command};

#[derive(Debug, Clone, Serialize, Type)]
pub struct RunningTask {
    pub run_id: u32,
    pub task: GradleTask,
}

struct Running {
    run_id: u32,
    task: GradleTask,
    pid: u32,
    stopped: bool,
}

#[derive(Default)]
pub struct GradleState {
    running: Mutex<Option<Running>>,
    next_id: AtomicU32,
}

impl GradleState {
    /// Is a build running or the game open? The updater asks before installing.
    pub fn is_busy(&self) -> bool {
        self.running.lock().unwrap().is_some()
    }
}

/// Sends every line from a pipe as a GradleOutput event.
fn pipe_lines(app: AppHandle, run_id: u32, stream: OutputStream, pipe: impl AsyncRead + Unpin + Send + 'static) {
    tauri::async_runtime::spawn(async move {
        let mut lines = BufReader::new(pipe).split(b'\n');
        while let Ok(Some(bytes)) = lines.next_segment().await {
            let line = String::from_utf8_lossy(&bytes).trim_end_matches('\r').to_string();
            let _ = GradleOutput { run_id, line, stream }.emit(&app);
        }
    });
}

/// Builds the command for one Gradle run (`gradlew <tasks> --console=plain`).
fn gradle_command(dir: &Path, wrapper: &Path, java_home: &str, tasks: &[String]) -> tokio::process::Command {
    // cmd.exe needs the full path: it may not search the current folder.
    let mut cmd = if cfg!(windows) {
        let mut c = quiet_async_command("cmd.exe");
        c.arg("/c").arg(wrapper);
        c
    } else {
        quiet_async_command(wrapper)
    };
    let path = std::env::var_os("PATH").unwrap_or_default();
    let mut paths = vec![Path::new(java_home).join("bin")];
    paths.extend(std::env::split_paths(&path));
    cmd.args(tasks)
        .arg("--console=plain")
        .current_dir(dir)
        .env("JAVA_HOME", java_home)
        .env("PATH", std::env::join_paths(paths).unwrap_or(path))
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .kill_on_drop(false);
    cmd
}

/// Gradle task names are plain words like `runDatagen` (never flags or paths).
fn is_task_name(name: &str) -> bool {
    name.chars().next().is_some_and(|c| c.is_ascii_alphabetic())
        && name.chars().all(|c| c.is_ascii_alphanumeric() || c == ':' || c == '_' || c == '-')
}

/// Starts a Gradle task. Returns its run id; output arrives as events.
/// `prepare` tasks (e.g. `runDatagen`) run first as their own Gradle run, because Gradle
/// can't order them before `build` inside one run. The loader target decides them.
#[tauri::command]
#[specta::specta]
pub async fn run_gradle(
    app: AppHandle,
    state: State<'_, GradleState>,
    project_dir: String,
    task: GradleTask,
    java_home: String,
    prepare: Vec<String>,
) -> AppResult<u32> {
    let dir = PathBuf::from(&project_dir);
    let wrapper = dir.join(if cfg!(windows) { "gradlew.bat" } else { "gradlew" });
    if !wrapper.exists() {
        return Err(AppError::new(ErrorCode::NotFound, "This project has no Gradle wrapper (gradlew)"));
    }
    if !Path::new(&java_home).join("bin").exists() {
        return Err(AppError::new(ErrorCode::JavaMissing, format!("No JDK found at {java_home}")));
    }
    if let Some(bad) = prepare.iter().find(|t| !is_task_name(t)) {
        return Err(AppError::new(ErrorCode::InvalidInput, format!("Not a Gradle task name: {bad}")));
    }

    let mut running = state.running.lock().unwrap();
    if running.is_some() {
        return Err(AppError::new(ErrorCode::Busy, "Another build or game is already running"));
    }

    // The runs, in order: prepare tasks (if any), then the task itself.
    let mut runs: Vec<Vec<String>> = Vec::new();
    if !prepare.is_empty() {
        runs.push(prepare);
    }
    runs.push(vec![task.gradle_name().to_string()]);

    let spawn_err = |e: std::io::Error| AppError::new(ErrorCode::GradleFailed, format!("Couldn't start Gradle: {e}"));
    let mut child = gradle_command(&dir, &wrapper, &java_home, &runs[0]).spawn().map_err(spawn_err)?;
    let run_id = state.next_id.fetch_add(1, Ordering::Relaxed) + 1;
    *running = Some(Running { run_id, task, pid: child.id().unwrap_or_default(), stopped: false });
    drop(running);

    // Run each step in the background, streaming its output; stop at the first failure or Stop.
    tauri::async_runtime::spawn(async move {
        let state = app.state::<GradleState>();
        let mut result = (false, None);
        for (i, tasks) in runs.iter().enumerate() {
            if i > 0 {
                // Check for Stop, spawn and record the new pid under one lock: a Stop can't
                // slip in between and kill the finished step's (possibly reused) pid.
                let mut running = state.running.lock().unwrap();
                let Some(run) = running.as_mut().filter(|r| !r.stopped) else { break };
                match gradle_command(&dir, &wrapper, &java_home, tasks).spawn() {
                    Ok(next) => {
                        child = next;
                        run.pid = child.id().unwrap_or_default();
                    }
                    Err(e) => {
                        drop(running);
                        let line = format!("Couldn't start Gradle: {e}");
                        let _ = GradleOutput { run_id, line, stream: OutputStream::Stderr }.emit(&app);
                        result = (false, None);
                        break;
                    }
                }
            }
            pipe_lines(app.clone(), run_id, OutputStream::Stdout, child.stdout.take().unwrap());
            pipe_lines(app.clone(), run_id, OutputStream::Stderr, child.stderr.take().unwrap());
            result = match child.wait().await {
                Ok(s) => (s.success(), s.code()),
                Err(_) => (false, None),
            };
            if !result.0 {
                break;
            }
        }
        let stopped = state.running.lock().unwrap().take().map(|r| r.stopped).unwrap_or(false);
        let (success, exit_code) = result;
        let _ = GradleFinished { run_id, task, success: success && !stopped, exit_code, stopped }.emit(&app);
    });

    Ok(run_id)
}

/// Stops the running task, including the game it may have started.
#[tauri::command]
#[specta::specta]
pub fn stop_gradle(state: State<'_, GradleState>) -> AppResult<()> {
    let mut running = state.running.lock().unwrap();
    if let Some(run) = running.as_mut() {
        run.stopped = true;
        kill_tree(run.pid);
    }
    Ok(())
}

/// What's running right now, if anything (for screens opened mid-build).
#[tauri::command]
#[specta::specta]
pub fn gradle_status(state: State<'_, GradleState>) -> Option<RunningTask> {
    state.running.lock().unwrap().as_ref().map(|r| RunningTask { run_id: r.run_id, task: r.task })
}

/// Copies the built mod jar (build/libs, not the -sources jar) to `destination`.
#[tauri::command]
#[specta::specta]
pub fn export_jar(project_dir: String, destination: String) -> AppResult<String> {
    let libs = Path::new(&project_dir).join("build").join("libs");
    let newest = std::fs::read_dir(&libs)
        .map_err(|_| AppError::new(ErrorCode::NotFound, "Build the mod first: no build/libs folder yet"))?
        .flatten()
        .map(|e| e.path())
        .filter(|p| {
            let name = p.file_name().and_then(|n| n.to_str()).unwrap_or_default();
            name.ends_with(".jar") && !name.ends_with("-sources.jar") && !name.ends_with("-dev.jar")
        })
        .max_by_key(|p| p.metadata().and_then(|m| m.modified()).ok());
    let jar = newest.ok_or_else(|| AppError::new(ErrorCode::NotFound, "Build the mod first: no jar found"))?;
    std::fs::copy(&jar, &destination)?;
    Ok(destination)
}
