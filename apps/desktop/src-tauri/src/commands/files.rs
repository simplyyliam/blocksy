//! File commands. They only move data in and out; deciding *what* to write
//! (the generator, the project file) happens in TypeScript.

use std::path::{Component, Path, PathBuf};

use base64::Engine;
use serde::Deserialize;
use specta::Type;
use tauri::Manager;

use crate::error::{AppError, AppResult, ErrorCode};

/// One file from the generator. Exactly one of `contents` / `base64` is set.
#[derive(Debug, Deserialize, Type)]
pub struct FileToWrite {
    /// Relative path inside the project, with forward slashes.
    pub path: String,
    pub contents: Option<String>,
    pub base64: Option<String>,
    #[serde(default)]
    pub executable: bool,
}

/// Rejects absolute paths and `..`, so a template can never write outside the project.
fn safe_join(root: &Path, relative: &str) -> AppResult<PathBuf> {
    let rel = Path::new(relative);
    let ok = rel.components().all(|c| matches!(c, Component::Normal(_)));
    if !ok || relative.is_empty() {
        return Err(AppError::new(ErrorCode::InvalidInput, format!("Unsafe file path: {relative}")));
    }
    Ok(root.join(rel))
}

/// The folder new projects go in by default: `~/Blocksy`.
#[tauri::command]
#[specta::specta]
pub fn default_projects_dir() -> AppResult<String> {
    let home = dirs::home_dir().ok_or_else(|| AppError::new(ErrorCode::NotFound, "No home folder found"))?;
    Ok(home.join("Blocksy").to_string_lossy().into_owned())
}

/// Writes generated files into `dir`. Refuses a non-empty folder unless `overwrite`.
#[tauri::command]
#[specta::specta]
pub fn write_project_files(dir: String, files: Vec<FileToWrite>, overwrite: bool) -> AppResult<()> {
    let root = PathBuf::from(&dir);
    if !overwrite && root.exists() && root.read_dir()?.next().is_some() {
        return Err(AppError::new(ErrorCode::AlreadyExists, format!("{dir} already exists and isn't empty")));
    }
    for file in files {
        let path = safe_join(&root, &file.path)?;
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        let bytes = match (file.contents, file.base64) {
            (Some(text), None) => text.into_bytes(),
            (None, Some(b64)) => base64::engine::general_purpose::STANDARD
                .decode(b64)
                .map_err(|e| AppError::new(ErrorCode::InvalidInput, format!("{}: {e}", file.path)))?,
            _ => return Err(AppError::new(ErrorCode::InvalidInput, format!("{}: needs contents or base64", file.path))),
        };
        std::fs::write(&path, bytes)?;
        #[cfg(not(unix))]
        let _ = file.executable; // Windows has no execute permission bit
        #[cfg(unix)]
        if file.executable {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o755))?;
        }
    }
    Ok(())
}

/// Deletes generated files that are no longer generated (a removed block's texture, ...),
/// then any folders that became empty. Paths are relative and checked like writes.
#[tauri::command]
#[specta::specta]
pub fn remove_project_files(dir: String, paths: Vec<String>) -> AppResult<()> {
    let root = PathBuf::from(&dir);
    for relative in paths {
        let path = safe_join(&root, &relative)?;
        match std::fs::remove_file(&path) {
            Ok(()) => {}
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => continue,
            Err(e) => return Err(e.into()),
        }
        // Tidy up: remove parent folders that are now empty, but never the project folder.
        let mut parent = path.parent();
        while let Some(folder) = parent {
            if folder == root || std::fs::remove_dir(folder).is_err() {
                break;
            }
            parent = folder.parent();
        }
    }
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn read_text_file(path: String) -> AppResult<String> {
    Ok(std::fs::read_to_string(path)?)
}

#[tauri::command]
#[specta::specta]
pub fn write_text_file(path: String, contents: String) -> AppResult<()> {
    if let Some(parent) = Path::new(&path).parent() {
        std::fs::create_dir_all(parent)?;
    }
    Ok(std::fs::write(path, contents)?)
}

#[tauri::command]
#[specta::specta]
pub fn path_exists(path: String) -> bool {
    Path::new(&path).exists()
}

/// App data (settings, recent projects) lives in the OS app-config folder.
/// `name` is a plain file stem like "settings", never a path.
fn app_file(app: &tauri::AppHandle, name: &str) -> AppResult<PathBuf> {
    if name.is_empty() || !name.chars().all(|c| c.is_ascii_lowercase() || c == '-') {
        return Err(AppError::new(ErrorCode::InvalidInput, format!("Bad app data name: {name}")));
    }
    Ok(app.path().app_config_dir()?.join(format!("{name}.json")))
}

/// Returns the saved JSON text, or `None` if it was never saved.
#[tauri::command]
#[specta::specta]
pub fn load_app_data(app: tauri::AppHandle, name: String) -> AppResult<Option<String>> {
    let path = app_file(&app, &name)?;
    match std::fs::read_to_string(path) {
        Ok(text) => Ok(Some(text)),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(e) => Err(e.into()),
    }
}

#[tauri::command]
#[specta::specta]
pub fn save_app_data(app: tauri::AppHandle, name: String, json: String) -> AppResult<()> {
    let path = app_file(&app, &name)?;
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    // Write to a temp file first, then rename, so a crash never leaves half a file.
    let tmp = path.with_extension("json.tmp");
    std::fs::write(&tmp, json)?;
    std::fs::rename(tmp, path)?;
    Ok(())
}
