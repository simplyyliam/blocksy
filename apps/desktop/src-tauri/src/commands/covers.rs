//! A project's custom cover picture. It lives inside the project, at
//! `<project>/.blocksy/cover.<png|jpg|jpeg|webp>`, so it travels with the project and
//! needs no change to blocksy.json. These commands only copy, read and delete that one
//! file; deciding when to show it happens in TypeScript.

use std::path::{Path, PathBuf};

use base64::Engine;

use crate::error::{AppError, AppResult, ErrorCode};

/// Image types we accept, with the MIME type used in the data URL.
const TYPES: [(&str, &str); 4] = [("png", "image/png"), ("jpg", "image/jpeg"), ("jpeg", "image/jpeg"), ("webp", "image/webp")];
/// Covers are small pictures; anything bigger is almost certainly the wrong file.
const MAX_BYTES: u64 = 8 * 1024 * 1024;

fn cover_dir(project: &str) -> PathBuf {
    Path::new(project).join(".blocksy")
}

/// The current cover file, if the project has one.
fn find_cover(project: &str) -> Option<(PathBuf, &'static str)> {
    TYPES.iter().find_map(|(ext, mime)| {
        let path = cover_dir(project).join(format!("cover.{ext}"));
        path.is_file().then_some((path, *mime))
    })
}

fn data_url(path: &Path, mime: &str) -> AppResult<String> {
    let bytes = std::fs::read(path)?;
    Ok(format!("data:{mime};base64,{}", base64::engine::general_purpose::STANDARD.encode(bytes)))
}

/// The cover as a `data:` URL the webview can show, or `None` for the generated one.
#[tauri::command]
#[specta::specta]
pub fn read_project_cover(dir: String) -> AppResult<Option<String>> {
    match find_cover(&dir) {
        Some((path, mime)) => Ok(Some(data_url(&path, mime)?)),
        None => Ok(None),
    }
}

/// Copies the picture at `source` into the project as its cover and returns it as a data URL.
#[tauri::command]
#[specta::specta]
pub fn set_project_cover(dir: String, source: String) -> AppResult<String> {
    let source = PathBuf::from(source);
    let ext = source.extension().and_then(|e| e.to_str()).map(str::to_ascii_lowercase).unwrap_or_default();
    let Some((ext, mime)) = TYPES.iter().find(|(e, _)| *e == ext) else {
        return Err(AppError::new(ErrorCode::InvalidInput, "Pick a PNG, JPG or WebP picture"));
    };
    if std::fs::metadata(&source)?.len() > MAX_BYTES {
        return Err(AppError::new(ErrorCode::InvalidInput, "That picture is over 8 MB; pick a smaller one"));
    }
    clear_project_cover(dir.clone())?; // a project has at most one cover
    std::fs::create_dir_all(cover_dir(&dir))?;
    let target = cover_dir(&dir).join(format!("cover.{ext}"));
    std::fs::copy(&source, &target)?;
    data_url(&target, mime)
}

/// Removes the custom cover, so the generated one shows again.
#[tauri::command]
#[specta::specta]
pub fn clear_project_cover(dir: String) -> AppResult<()> {
    while let Some((path, _)) = find_cover(&dir) {
        std::fs::remove_file(path)?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn set_read_and_clear_a_cover() {
        let project = std::env::temp_dir().join(format!("blocksy-cover-test-{}", std::process::id()));
        std::fs::create_dir_all(&project).unwrap();
        let picture = project.join("picked.PNG");
        std::fs::write(&picture, [0x89, b'P', b'N', b'G']).unwrap();
        let dir = project.to_string_lossy().into_owned();

        let url = set_project_cover(dir.clone(), picture.to_string_lossy().into_owned()).unwrap();
        assert!(url.starts_with("data:image/png;base64,"));
        assert_eq!(read_project_cover(dir.clone()).unwrap(), Some(url));

        clear_project_cover(dir.clone()).unwrap();
        assert_eq!(read_project_cover(dir.clone()).unwrap(), None);
        std::fs::remove_dir_all(project).unwrap();
    }

    #[test]
    fn rejects_files_that_are_not_pictures() {
        let err = set_project_cover("x".into(), "notes.txt".into()).unwrap_err();
        assert_eq!(err.code, ErrorCode::InvalidInput);
    }
}
