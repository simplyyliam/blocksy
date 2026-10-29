//! Typed events Rust pushes to the frontend. Each becomes `events.<name>` in bindings.ts.

use serde::{Deserialize, Serialize};
use specta::Type;
use tauri_specta::Event;

/// Which Gradle task is running.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, Type, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum GradleTask {
    Build,
    RunClient,
    Clean,
}

impl GradleTask {
    pub fn gradle_name(self) -> &'static str {
        match self {
            GradleTask::Build => "build",
            GradleTask::RunClient => "runClient",
            GradleTask::Clean => "clean",
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, Type)]
#[serde(rename_all = "snake_case")]
pub enum OutputStream {
    Stdout,
    Stderr,
}

/// One line of Gradle (or game) output.
#[derive(Debug, Clone, Serialize, Deserialize, Type, Event)]
pub struct GradleOutput {
    pub run_id: u32,
    pub line: String,
    pub stream: OutputStream,
}

/// A Gradle task ended (finished, failed or was stopped).
#[derive(Debug, Clone, Serialize, Deserialize, Type, Event)]
pub struct GradleFinished {
    pub run_id: u32,
    pub task: GradleTask,
    pub success: bool,
    pub exit_code: Option<i32>,
    /// True when the user pressed Stop.
    pub stopped: bool,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, Type, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum UpdateState {
    /// Updates aren't set up in this build (dev build, or no signing key yet).
    Disabled,
    Idle,
    Checking,
    Downloading,
    /// Downloaded and verified; installs on restart.
    Ready,
    Error,
}

/// Where the auto-updater is. The UI shows a quiet note when `state` is `ready`.
#[derive(Debug, Clone, Serialize, Deserialize, Type, Event)]
pub struct UpdateStatus {
    pub state: UpdateState,
    pub version: Option<String>,
    pub message: Option<String>,
}
