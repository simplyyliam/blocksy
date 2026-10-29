//! The one error contract between Rust and the frontend (plan section 2.5).
//! Every command returns `Result<T, AppError>`; the generated bindings turn that
//! into `{ status: "ok", data }` or `{ status: "error", error: { code, message } }`.

use serde::Serialize;
use specta::Type;

/// Stable error codes, sent as snake_case strings.
/// Adding a code is fine; renaming or removing one is a breaking change.
#[derive(Debug, Clone, Copy, Serialize, Type, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ErrorCode {
    /// A bug or something unexpected inside Blocksy.
    Internal,
    /// The frontend sent something invalid (bad path, bad name).
    InvalidInput,
    /// A file or folder that should exist doesn't.
    NotFound,
    /// The target already exists (e.g. a non-empty project folder).
    AlreadyExists,
    /// No usable JDK was found or the chosen one doesn't work.
    JavaMissing,
    /// Gradle exited with an error.
    GradleFailed,
    /// Another Gradle task or the game is running.
    Busy,
    /// The OS or this build can't do it.
    Unsupported,
    /// A service (like the update server) can't be reached right now.
    Unavailable,
    /// Reading or writing a file failed.
    Io,
}

#[derive(Debug, Clone, Serialize, Type)]
pub struct AppError {
    pub code: ErrorCode,
    /// Plain-language message the UI can show as-is.
    pub message: String,
}

impl AppError {
    pub fn new(code: ErrorCode, message: impl Into<String>) -> Self {
        Self { code, message: message.into() }
    }
}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        let code = match err.kind() {
            std::io::ErrorKind::NotFound => ErrorCode::NotFound,
            std::io::ErrorKind::AlreadyExists => ErrorCode::AlreadyExists,
            _ => ErrorCode::Io,
        };
        Self::new(code, err.to_string())
    }
}

impl From<tauri::Error> for AppError {
    fn from(err: tauri::Error) -> Self {
        Self::new(ErrorCode::Internal, err.to_string())
    }
}

pub type AppResult<T> = Result<T, AppError>;
