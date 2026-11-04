//! Minecraft's own assets, read from the copy already on this computer (plan rule 2.2.10:
//! Blocksy never ships Minecraft's assets). Fabric's Gradle plugin downloads them for the
//! first build into ~/.gradle/caches/fabric-loom/assets: an index (path -> hash) plus the
//! files named by hash. Only sounds are readable, so the editor can let you hear a block.

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

use base64::Engine;

use crate::error::{AppError, AppResult, ErrorCode};

/// The newest asset index, parsed once per run: sound path -> file hash.
static INDEX: Mutex<Option<HashMap<String, String>>> = Mutex::new(None);

fn assets_dir() -> Option<PathBuf> {
    Some(dirs::home_dir()?.join(".gradle/caches/fabric-loom/assets"))
}

/// Only sound files and the sound list, with plain names (no "..", no other folders).
fn allowed(path: &str) -> bool {
    let plain = path.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || "_/.-".contains(c)) && !path.contains("..");
    plain && (path == "minecraft/sounds.json" || (path.starts_with("minecraft/sounds/") && path.ends_with(".ogg")))
}

/// Reads the newest index that has sounds and keeps just the sound entries.
fn load_index(root: &Path) -> Option<HashMap<String, String>> {
    let mut indexes: Vec<_> = std::fs::read_dir(root.join("indexes")).ok()?.flatten().collect();
    indexes.sort_by_key(|e| std::cmp::Reverse(e.metadata().and_then(|m| m.modified()).ok()));
    indexes.iter().find_map(|entry| {
        let json: serde_json::Value = serde_json::from_str(&std::fs::read_to_string(entry.path()).ok()?).ok()?;
        let objects = json["objects"].as_object()?;
        let map: HashMap<String, String> = objects
            .iter()
            .filter(|(path, _)| allowed(path))
            .filter_map(|(path, o)| Some((path.clone(), o["hash"].as_str()?.to_string())))
            .filter(|(_, hash)| hash.len() == 40 && hash.chars().all(|c| c.is_ascii_hexdigit()))
            .collect();
        map.contains_key("minecraft/sounds.json").then_some(map)
    })
}

/// The file's hash, loading the index the first time (and again if it was missing before).
fn find_hash(root: &Path, path: &str) -> Option<String> {
    let mut cache = INDEX.lock().ok()?;
    if cache.is_none() {
        *cache = load_index(root);
    }
    cache.as_ref()?.get(path).cloned()
}

fn read(path: &str) -> AppResult<String> {
    if !allowed(path) {
        return Err(AppError::new(ErrorCode::InvalidInput, "Only Minecraft sounds can be read"));
    }
    let missing = || AppError::new(ErrorCode::NotFound, "Build a project once so Minecraft's sounds are downloaded");
    let root = assets_dir().ok_or_else(missing)?;
    let hash = find_hash(&root, path).ok_or_else(missing)?;
    let bytes = std::fs::read(root.join("objects").join(&hash[..2]).join(&hash)).map_err(|_| missing())?;
    Ok(base64::engine::general_purpose::STANDARD.encode(bytes))
}

/// One of Minecraft's sound files (or sounds.json), base64, from the local asset cache.
/// `not_found` until a first build has downloaded Minecraft.
#[tauri::command]
#[specta::specta]
pub async fn read_minecraft_asset(path: String) -> AppResult<String> {
    tauri::async_runtime::spawn_blocking(move || read(&path))
        .await
        .map_err(|e| AppError::new(ErrorCode::Internal, e.to_string()))?
}

#[cfg(test)]
mod tests {
    use super::allowed;

    #[test]
    fn only_sounds_are_allowed() {
        assert!(allowed("minecraft/sounds.json"));
        assert!(allowed("minecraft/sounds/dig/stone1.ogg"));
        assert!(!allowed("minecraft/textures/block/stone.png"));
        assert!(!allowed("minecraft/sounds/../../secret.ogg"));
        assert!(!allowed("minecraft/sounds/Dig/Stone1.ogg"));
    }
}
