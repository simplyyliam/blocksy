//! Local version history (plan v0.3): "Save version" is a git commit in the project folder.
//! Thin on purpose (rule 2.2.8): these commands only run `git` and pass text back.
//! Deciding what to restore, and restoring it as an undoable change, happens in TypeScript.
//!
//!   history_available  is git installed?
//!   history_list       the saved versions, newest first
//!   history_save       commit everything (starts the repo the first time)
//!   history_file       one file's text at a saved version (blocksy.json, to restore it)

use std::path::{Component, Path};
use std::process::Output;

use serde::Serialize;
use specta::Type;

use crate::error::{AppError, AppResult, ErrorCode};
use crate::process::quiet_command;

/// One saved version.
#[derive(Debug, Clone, Serialize, Type)]
pub struct Version {
    /// Full commit id.
    pub id: String,
    /// Short commit id, for display.
    pub short: String,
    /// The message the user typed.
    pub message: String,
    /// When it was saved, ISO 8601 (e.g. "2026-11-04T13:05:00+01:00").
    pub date: String,
    /// How many files changed compared with the version before.
    pub files_changed: u32,
}

/// Runs git in `dir` with no console window. `-c` settings keep output plain and stable.
fn git(dir: &Path, args: &[&str]) -> AppResult<Output> {
    quiet_command("git")
        .arg("-C")
        .arg(dir)
        .args(["-c", "core.quotepath=false", "-c", "color.ui=false"])
        .args(args)
        .output()
        .map_err(|_| AppError::new(ErrorCode::Unsupported, "Git isn't installed. Install it from git-scm.com to save versions."))
}

/// Git's output, or an error with git's own message.
fn ok(out: Output) -> AppResult<String> {
    if out.status.success() {
        Ok(String::from_utf8_lossy(&out.stdout).into_owned())
    } else {
        let message = String::from_utf8_lossy(&out.stderr).trim().to_string();
        Err(AppError::new(ErrorCode::Internal, if message.is_empty() { "Git failed".into() } else { message }))
    }
}

fn project_dir(dir: &str) -> AppResult<&Path> {
    let path = Path::new(dir);
    if !path.is_dir() {
        return Err(AppError::new(ErrorCode::NotFound, format!("{dir} isn't a folder")));
    }
    Ok(path)
}

/// True when this project folder is its own git repository (not just inside another one).
fn has_repo(dir: &Path) -> bool {
    dir.join(".git").exists()
}

/// Parses `git log` output written with the format used in `history_list`.
fn parse_log(text: &str) -> Vec<Version> {
    text.split('\u{1e}')
        .filter(|chunk| !chunk.trim().is_empty())
        .filter_map(|chunk| {
            let mut lines = chunk.lines();
            let fields: Vec<&str> = lines.next()?.split('\u{1f}').collect();
            if fields.len() < 4 {
                return None;
            }
            // The --shortstat line: " 3 files changed, 10 insertions(+)". Missing = 0.
            let files_changed = lines
                .find(|l| l.contains("changed"))
                .and_then(|l| l.split_whitespace().next())
                .and_then(|n| n.parse().ok())
                .unwrap_or(0);
            Some(Version {
                id: fields[0].to_string(),
                short: fields[1].to_string(),
                date: fields[2].to_string(),
                message: fields[3..].join("\u{1f}"),
                files_changed,
            })
        })
        .collect()
}

fn list(dir: &Path, limit: &str) -> AppResult<Vec<Version>> {
    if !has_repo(dir) {
        return Ok(Vec::new());
    }
    let out = git(dir, &["log", "-n", limit, "--shortstat", "--format=%x1e%H%x1f%h%x1f%cI%x1f%s"])?;
    // A repo with no commits yet makes `git log` fail: that just means no versions.
    if !out.status.success() {
        return Ok(Vec::new());
    }
    Ok(parse_log(&String::from_utf8_lossy(&out.stdout)))
}

/// Is git installed? (History shows a friendly note when it isn't.)
#[tauri::command]
#[specta::specta]
pub async fn history_available() -> bool {
    quiet_command("git").arg("--version").output().is_ok_and(|o| o.status.success())
}

/// The project's saved versions, newest first (empty before the first save).
#[tauri::command]
#[specta::specta]
pub async fn history_list(dir: String) -> AppResult<Vec<Version>> {
    list(project_dir(&dir)?, "200")
}

/// Saves a version: commits every file in the project (the .gitignore Blocksy writes keeps
/// build output out). Starts the repository on the first save. Returns None when nothing
/// changed since the last version.
#[tauri::command]
#[specta::specta]
pub async fn history_save(dir: String, message: String) -> AppResult<Option<Version>> {
    let dir = project_dir(&dir)?;
    let message = message.trim();
    if message.is_empty() || message.len() > 200 {
        return Err(AppError::new(ErrorCode::InvalidInput, "Describe the version in 1 to 200 characters"));
    }
    if !has_repo(dir) {
        ok(git(dir, &["init", "-q"])?)?;
    }
    ok(git(dir, &["add", "-A"])?)?;
    if ok(git(dir, &["status", "--porcelain"])?)?.trim().is_empty() {
        return Ok(None);
    }
    // Use the person's git name if they set one; otherwise sign versions as Blocksy.
    let named = git(dir, &["config", "user.email"]).is_ok_and(|o| o.status.success() && !o.stdout.trim_ascii().is_empty());
    let mut args = vec![];
    if !named {
        args.extend(["-c", "user.name=Blocksy", "-c", "user.email=blocksy@localhost"]);
    }
    args.extend(["commit", "-q", "--no-verify", "-m", message]);
    ok(git(dir, &args)?)?;
    Ok(list(dir, "1")?.into_iter().next())
}

/// One file's text at a saved version, e.g. blocksy.json to restore the project from it.
#[tauri::command]
#[specta::specta]
pub async fn history_file(dir: String, id: String, path: String) -> AppResult<String> {
    let dir = project_dir(&dir)?;
    let id_ok = (4..=64).contains(&id.len()) && id.chars().all(|c| c.is_ascii_hexdigit());
    let path_ok = !path.is_empty() && Path::new(&path).components().all(|c| matches!(c, Component::Normal(_)));
    if !id_ok || !path_ok {
        return Err(AppError::new(ErrorCode::InvalidInput, "Unknown version or file"));
    }
    let spec = format!("{id}:{}", path.replace('\\', "/"));
    ok(git(dir, &["show", &spec])?)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_log_with_and_without_stats() {
        let text = "\u{1e}abc123\u{1f}abc\u{1f}2026-11-04T10:00:00+00:00\u{1f}Added the bun\n\n 3 files changed, 10 insertions(+)\n\
                    \u{1e}def456\u{1f}def\u{1f}2026-11-03T10:00:00+00:00\u{1f}First\n";
        let versions = parse_log(text);
        assert_eq!(versions.len(), 2);
        assert_eq!(versions[0].message, "Added the bun");
        assert_eq!(versions[0].files_changed, 3);
        assert_eq!(versions[1].files_changed, 0);
    }

    #[test]
    fn saves_lists_and_reads_versions() {
        let dir = std::env::temp_dir().join(format!("blocksy-history-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(dir.join("blocksy.json"), "{\"v\":1}").unwrap();
        let rt = tokio::runtime::Builder::new_current_thread().build().unwrap();
        let d = dir.to_string_lossy().into_owned();
        if !rt.block_on(history_available()) {
            return; // no git on this machine: nothing to test
        }
        let first = rt.block_on(history_save(d.clone(), "First".into())).unwrap().unwrap();
        assert!(rt.block_on(history_save(d.clone(), "Nothing changed".into())).unwrap().is_none());
        std::fs::write(dir.join("blocksy.json"), "{\"v\":2}").unwrap();
        rt.block_on(history_save(d.clone(), "Second".into())).unwrap().unwrap();
        let versions = rt.block_on(history_list(d.clone())).unwrap();
        assert_eq!(versions.iter().map(|v| v.message.as_str()).collect::<Vec<_>>(), ["Second", "First"]);
        assert_eq!(rt.block_on(history_file(d.clone(), first.id, "blocksy.json".into())).unwrap(), "{\"v\":1}");
        assert!(rt.block_on(history_file(d.clone(), "zz".into(), "blocksy.json".into())).is_err());
        assert!(rt.block_on(history_file(d, "abcd".into(), "../secret".into())).is_err());
        let _ = std::fs::remove_dir_all(&dir);
    }
}
