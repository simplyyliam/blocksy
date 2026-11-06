//! The two windows (ADR 0020): a fixed-size `welcome` window and the `editor` window.
//! Thin on purpose (rule 2.2.8): this only creates and closes windows. Which project to open,
//! and everything else, is decided in TypeScript.
//!
//!   open_editor         build the editor (or send it a project), then close the welcome window
//!   show_welcome        build the welcome window, then close the editor
//!   take_editor_launch  the editor asks once, at start, which project it was opened for
//!
//! The new window is always built before the old one closes, so the app never has zero windows.

use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::{AppHandle, Emitter, Manager, State, WebviewWindowBuilder};

use crate::error::{AppError, AppResult, ErrorCode};

const WELCOME: &str = "welcome";
const EDITOR: &str = "editor";

/// What the editor window was opened for.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct EditorLaunch {
    pub project_dir: String,
    /// True right after "Create": the editor starts the workspace setup (v0.4) straight away.
    pub prepare: bool,
}

/// The launch waiting for a freshly built editor window (taken once).
#[derive(Default)]
pub struct PendingLaunch(Mutex<Option<EditorLaunch>>);

/// Builds the window with this label from its entry in tauri.conf.json (sizes stay in the config).
fn build(app: &AppHandle, label: &str) -> AppResult<()> {
    let config = app
        .config()
        .app
        .windows
        .iter()
        .find(|w| w.label == label)
        .ok_or_else(|| AppError::new(ErrorCode::Internal, format!("No window config for {label}")))?;
    WebviewWindowBuilder::from_config(app, config)?.build()?;
    Ok(())
}

fn close(app: &AppHandle, label: &str) {
    if let Some(window) = app.get_webview_window(label) {
        let _ = window.close();
    }
}

/// Opens a project: builds the editor (it then asks `take_editor_launch`), or, if the editor
/// already exists, tells it with an `open-project` event. Then the welcome window closes.
#[tauri::command]
#[specta::specta]
pub async fn open_editor(app: AppHandle, pending: State<'_, PendingLaunch>, launch: EditorLaunch) -> AppResult<()> {
    if let Some(editor) = app.get_webview_window(EDITOR) {
        editor.emit("open-project", &launch)?;
        let _ = editor.set_focus();
    } else {
        *pending.0.lock().unwrap_or_else(|e| e.into_inner()) = Some(launch);
        if let Err(err) = build(&app, EDITOR) {
            // The welcome window stays open: a stale launch must not wait for some later editor.
            pending.0.lock().unwrap_or_else(|e| e.into_inner()).take();
            return Err(err);
        }
    }
    close(&app, WELCOME);
    Ok(())
}

/// Brings the welcome window back (File > Close Project) and closes the editor.
#[tauri::command]
#[specta::specta]
pub async fn show_welcome(app: AppHandle) -> AppResult<()> {
    match app.get_webview_window(WELCOME) {
        Some(welcome) => {
            let _ = welcome.set_focus();
        }
        None => build(&app, WELCOME)?,
    }
    close(&app, EDITOR);
    Ok(())
}

/// The project the editor was opened for, once. `None` when there is nothing waiting.
#[tauri::command]
#[specta::specta]
pub fn take_editor_launch(pending: State<'_, PendingLaunch>) -> Option<EditorLaunch> {
    pending.0.lock().unwrap_or_else(|e| e.into_inner()).take()
}
