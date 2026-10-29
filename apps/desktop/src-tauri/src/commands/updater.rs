//! Auto-updates (plan section 2.6): check GitHub Releases on startup and every few
//! hours, download in the background, then tell the UI an update is ready.
//! Installing waits until no Gradle task or game is running.

use std::sync::Mutex;
use std::time::Duration;

use tauri::{AppHandle, Manager, State};
use tauri_plugin_updater::{Update, UpdaterExt};
use tauri_specta::Event;

use crate::commands::gradle::GradleState;
use crate::error::{AppError, AppResult, ErrorCode};
use crate::events::{UpdateState, UpdateStatus};

const CHECK_EVERY: Duration = Duration::from_secs(4 * 60 * 60);
const FIRST_CHECK_AFTER: Duration = Duration::from_secs(8);

pub struct UpdaterState {
    /// False in builds without an updater signing key (and in dev builds).
    pub enabled: bool,
    status: Mutex<UpdateStatus>,
    pending: Mutex<Option<(Update, Vec<u8>)>>,
}

impl UpdaterState {
    pub fn new(enabled: bool) -> Self {
        let state = if enabled { UpdateState::Idle } else { UpdateState::Disabled };
        Self { enabled, status: Mutex::new(UpdateStatus { state, version: None, message: None }), pending: Mutex::new(None) }
    }
}

fn set_status(app: &AppHandle, state: UpdateState, version: Option<String>, message: Option<String>) {
    let status = UpdateStatus { state, version, message };
    *app.state::<UpdaterState>().status.lock().unwrap() = status.clone();
    let _ = status.emit(app);
}

/// One check: if there's a newer signed release, download and verify it.
async fn check_once(app: &AppHandle) -> AppResult<Option<String>> {
    if app.state::<UpdaterState>().pending.lock().unwrap().is_some() {
        return Ok(None); // already downloaded one; it installs on restart
    }
    set_status(app, UpdateState::Checking, None, None);
    let updater = app.updater().map_err(|e| AppError::new(ErrorCode::Unavailable, e.to_string()))?;
    let found = updater.check().await.map_err(|e| AppError::new(ErrorCode::Unavailable, e.to_string()))?;
    let Some(update) = found else {
        set_status(app, UpdateState::Idle, None, None);
        return Ok(None);
    };
    let version = update.version.clone();
    set_status(app, UpdateState::Downloading, Some(version.clone()), None);
    let bytes = update
        .download(|_, _| {}, || {})
        .await
        .map_err(|e| AppError::new(ErrorCode::Unavailable, e.to_string()))?;
    *app.state::<UpdaterState>().pending.lock().unwrap() = Some((update, bytes));
    set_status(app, UpdateState::Ready, Some(version.clone()), None);
    Ok(Some(version))
}

/// Starts the background loop. Called once at startup.
pub fn start(app: AppHandle) {
    if !app.state::<UpdaterState>().enabled {
        return;
    }
    tauri::async_runtime::spawn(async move {
        tokio::time::sleep(FIRST_CHECK_AFTER).await;
        loop {
            if let Err(err) = check_once(&app).await {
                set_status(&app, UpdateState::Error, None, Some(err.message));
            }
            tokio::time::sleep(CHECK_EVERY).await;
        }
    });
}

/// The current updater state, for screens that open after an event was sent.
#[tauri::command]
#[specta::specta]
pub fn update_status(state: State<'_, UpdaterState>) -> UpdateStatus {
    state.status.lock().unwrap().clone()
}

/// Checks right now (Settings > Check for updates). Returns the new version, if any.
#[tauri::command]
#[specta::specta]
pub async fn check_for_updates(app: AppHandle) -> AppResult<Option<String>> {
    if !app.state::<UpdaterState>().enabled {
        return Err(AppError::new(ErrorCode::Unsupported, "Updates aren't set up in this build"));
    }
    let result = check_once(&app).await;
    if let Err(err) = &result {
        set_status(&app, UpdateState::Error, None, Some(err.message.clone()));
    }
    result
}

/// Installs the downloaded update and restarts. Refuses while a build or the game runs.
#[tauri::command]
#[specta::specta]
pub fn install_update(app: AppHandle, gradle: State<'_, GradleState>, state: State<'_, UpdaterState>) -> AppResult<()> {
    if gradle.is_busy() {
        return Err(AppError::new(ErrorCode::Busy, "Finish the build or close Minecraft first"));
    }
    let (update, bytes) = state
        .pending
        .lock()
        .unwrap()
        .take()
        .ok_or_else(|| AppError::new(ErrorCode::NotFound, "No update is ready yet"))?;
    update.install(bytes).map_err(|e| AppError::new(ErrorCode::Internal, e.to_string()))?;
    app.restart();
}
