//! The workspace files of a project's Minecraft version, found in the user's own Gradle
//! cache (ADR 0011). Rust stays thin: it finds files, opens a jar and returns raw bytes.
//! Everything that understands those bytes (sprites, .mcmeta, models, the font) is TypeScript.
//!
//! Safety rules, all enforced here:
//! - a jar can only be opened if it lives inside the Gradle cache (`~/.gradle/caches`)
//! - only entries under `assets/` can be read or listed, with plain names (no `..`)
//! - nothing is ever written, copied or bundled: bytes go to memory in the app, no further

use std::fs::File;
use std::io::Read;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

use base64::Engine;
use serde::Serialize;
use specta::Type;
use zip::ZipArchive;

use crate::error::{AppError, AppResult, ErrorCode};

/// Biggest single entry we hand back (a 4096x4096 texture is far below this).
const MAX_ENTRY_BYTES: u64 = 16 * 1024 * 1024;

fn caches_dir() -> Option<PathBuf> {
    Some(dirs::home_dir()?.join(".gradle/caches"))
}

/// Paths the workspace index stores. Missing pieces are `None` / empty: the app then shows
/// "Build once to load Minecraft's look".
#[derive(Debug, Serialize, Type, Default)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceFiles {
    pub client_jar: Option<String>,
    pub asset_index: Option<String>,
    pub asset_objects: Option<String>,
    pub loader_jars: Vec<String>,
}

/// "26.1.2" style versions only: digits, dots and letters, so it can't walk out of a folder.
fn plain_version(v: &str) -> bool {
    !v.is_empty() && v.len() <= 32 && v.chars().all(|c| c.is_ascii_alphanumeric() || c == '.' || c == '-')
}

fn as_text(p: &Path) -> String {
    p.to_string_lossy().replace('\\', "/")
}

/// An asset index file name for exactly this version: "<version>-<digits>.json" ("1.21-5.json").
/// A prefix test alone would also match another version's index ("1.21-pre1-5.json").
fn is_index_for(name: &str, version: &str) -> bool {
    name.strip_prefix(version)
        .and_then(|rest| rest.strip_prefix('-'))
        .and_then(|rest| rest.strip_suffix(".json"))
        .is_some_and(|number| !number.is_empty() && number.chars().all(|c| c.is_ascii_digit()))
}

/// Jars named `<artifact>-<version>.jar` below a Gradle module folder (no sources jars).
/// `only_for` keeps just jars built for one Minecraft version (Fabric API ends in "+26.1.2").
fn module_jars(root: &Path, group: &str, artifact: &str, only_for: Option<&str>) -> Vec<String> {
    let base = root.join("modules-2/files-2.1").join(group).join(artifact);
    let mut found = Vec::new();
    let Ok(versions) = std::fs::read_dir(&base) else { return found };
    for version in versions.flatten() {
        let Ok(hashes) = std::fs::read_dir(version.path()) else { continue };
        for hash in hashes.flatten() {
            let Ok(files) = std::fs::read_dir(hash.path()) else { continue };
            for file in files.flatten() {
                let name = file.file_name().to_string_lossy().to_string();
                let for_version = only_for.map_or(true, |mc| name.ends_with(&format!("+{mc}.jar")));
                if name.starts_with(artifact) && name.ends_with(".jar") && !name.contains("sources") && !name.contains("javadoc") && for_version {
                    found.push(as_text(&file.path()));
                }
            }
        }
    }
    found.sort();
    found
}

/// Where the Minecraft client jar, the asset index and the loader jars are for this version.
#[tauri::command]
#[specta::specta]
pub fn find_workspace_files(minecraft_version: String) -> AppResult<WorkspaceFiles> {
    if !plain_version(&minecraft_version) {
        return Err(AppError::new(ErrorCode::InvalidInput, "Bad Minecraft version"));
    }
    let Some(root) = caches_dir() else { return Ok(WorkspaceFiles::default()) };
    let loom = root.join("fabric-loom");
    let jar = loom.join(&minecraft_version).join("minecraft-client.jar");

    // The asset index is named "<version>-<number>.json"; take the newest one for this version.
    let mut indexes: Vec<_> = std::fs::read_dir(loom.join("assets/indexes"))
        .map(|d| d.flatten().filter(|e| is_index_for(&e.file_name().to_string_lossy(), &minecraft_version)).collect())
        .unwrap_or_default();
    indexes.sort_by_key(|e| std::cmp::Reverse(e.metadata().and_then(|m| m.modified()).ok()));

    // Fabric Loader works with every Minecraft version (the newest two are kept); Fabric API is
    // built per version, so only this version's jars count.
    let mut loader_jars: Vec<String> = module_jars(&root, "net.fabricmc", "fabric-loader", None).into_iter().rev().take(2).collect();
    loader_jars.extend(module_jars(&root, "net.fabricmc.fabric-api", "fabric-api", Some(&minecraft_version)));
    loader_jars.truncate(8);

    Ok(WorkspaceFiles {
        client_jar: jar.is_file().then(|| as_text(&jar)),
        asset_index: indexes.first().map(|e| as_text(&e.path())),
        asset_objects: loom.join("assets/objects").is_dir().then(|| as_text(&loom.join("assets/objects"))),
        loader_jars,
    })
}

/// The last jar that was opened, so reading many sprites doesn't re-read the jar's directory.
static OPEN: Mutex<Option<(PathBuf, ZipArchive<File>)>> = Mutex::new(None);

/// The jar must be a `.jar` inside the Gradle cache (after resolving links and `..`).
fn checked_jar(jar: &str) -> AppResult<PathBuf> {
    let bad = || AppError::new(ErrorCode::InvalidInput, "That jar can't be read");
    let root = caches_dir().and_then(|r| r.canonicalize().ok()).ok_or_else(bad)?;
    let path = Path::new(jar).canonicalize().map_err(|_| AppError::new(ErrorCode::NotFound, "Build once to load Minecraft's look"))?;
    if !path.starts_with(&root) || path.extension().and_then(|e| e.to_str()) != Some("jar") {
        return Err(bad());
    }
    Ok(path)
}

/// Plain names under `assets/` only.
fn checked_entry(entry: &str) -> AppResult<()> {
    let plain = entry.len() <= 240
        && !entry.contains("..")
        && !entry.contains('\\')
        && entry.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || "_/.-".contains(c));
    if plain && entry.starts_with("assets/") {
        Ok(())
    } else {
        Err(AppError::new(ErrorCode::InvalidInput, "Only files under assets/ can be read"))
    }
}

fn with_archive<T>(jar: &str, f: impl FnOnce(&mut ZipArchive<File>) -> AppResult<T>) -> AppResult<T> {
    let path = checked_jar(jar)?;
    let mut open = OPEN.lock().map_err(|_| AppError::new(ErrorCode::Internal, "Jar cache is locked"))?;
    if open.as_ref().map(|(p, _)| p != &path).unwrap_or(true) {
        let file = File::open(&path)?;
        let archive = ZipArchive::new(file).map_err(|e| AppError::new(ErrorCode::Internal, format!("Can't open jar: {e}")))?;
        *open = Some((path, archive));
    }
    let (_, archive) = open.as_mut().expect("just opened");
    f(archive)
}

/// One file from the jar as base64, or `None` when the jar has no such file.
#[tauri::command]
#[specta::specta]
pub fn read_jar_entry(jar: String, entry: String) -> AppResult<Option<String>> {
    checked_entry(&entry)?;
    with_archive(&jar, |archive| {
        let Ok(mut file) = archive.by_name(&entry) else { return Ok(None) };
        if file.size() > MAX_ENTRY_BYTES {
            return Err(AppError::new(ErrorCode::InvalidInput, "That file is too big"));
        }
        // The declared size comes from the jar itself, so the read is bounded too.
        let mut bytes = Vec::with_capacity(file.size().min(MAX_ENTRY_BYTES) as usize);
        (&mut file).take(MAX_ENTRY_BYTES + 1).read_to_end(&mut bytes)?;
        if bytes.len() as u64 > MAX_ENTRY_BYTES {
            return Err(AppError::new(ErrorCode::InvalidInput, "That file is too big"));
        }
        Ok(Some(base64::engine::general_purpose::STANDARD.encode(bytes)))
    })
}

/// Names of the files in the jar below a folder (`assets/minecraft/items/`), not folders.
#[tauri::command]
#[specta::specta]
pub fn list_jar_entries(jar: String, prefix: String) -> AppResult<Vec<String>> {
    checked_entry(&prefix)?;
    with_archive(&jar, |archive| {
        let names: Vec<String> = archive.file_names().filter(|n| n.starts_with(&prefix) && !n.ends_with('/')).map(String::from).collect();
        Ok(names)
    })
}

/// Reads the asset objects the index points at (sounds, languages): hash -> bytes as base64.
/// Only `assets/minecraft` style entries, same limits as jar entries.
#[tauri::command]
#[specta::specta]
pub fn read_asset_object(objects_dir: String, hash: String) -> AppResult<Option<String>> {
    let bad = || AppError::new(ErrorCode::InvalidInput, "Bad asset object");
    if hash.len() != 40 || !hash.chars().all(|c| c.is_ascii_hexdigit()) {
        return Err(bad());
    }
    let root = caches_dir().and_then(|r| r.canonicalize().ok()).ok_or_else(bad)?;
    let dir = Path::new(&objects_dir).canonicalize().map_err(|_| bad())?;
    if !dir.starts_with(&root) {
        return Err(bad());
    }
    match std::fs::read(dir.join(&hash[..2]).join(&hash)) {
        Ok(bytes) if (bytes.len() as u64) <= MAX_ENTRY_BYTES => Ok(Some(base64::engine::general_purpose::STANDARD.encode(bytes))),
        Ok(_) => Err(bad()),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(e) => Err(e.into()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn entries_must_be_plain_and_under_assets() {
        assert!(checked_entry("assets/minecraft/textures/item/apple.png").is_ok());
        assert!(checked_entry("assets/minecraft/../../etc/passwd").is_err());
        assert!(checked_entry("META-INF/MANIFEST.MF").is_err());
        assert!(checked_entry("assets\\minecraft\\x.png").is_err());
        assert!(checked_entry("assets/Minecraft/X.png").is_err());
    }

    #[test]
    fn asset_index_names_match_one_version_exactly() {
        assert!(is_index_for("26.1.2-30.json", "26.1.2"));
        assert!(!is_index_for("26.1.2-pre1-30.json", "26.1.2"));
        assert!(!is_index_for("26.1.2-30.json.tmp", "26.1.2"));
        assert!(!is_index_for("26.1-30.json", "26.1.2"));
        assert!(is_index_for("1.21-5.json", "1.21") && !is_index_for("1.21-pre1-5.json", "1.21"));
    }

    #[test]
    fn versions_cannot_walk_out_of_a_folder() {
        assert!(plain_version("26.1.2"));
        assert!(!plain_version("../x"));
        assert!(!plain_version(""));
        assert!(!plain_version("a/b"));
    }

    #[test]
    fn jars_outside_the_gradle_cache_are_refused() {
        // Even a real file that is not inside ~/.gradle/caches is not readable.
        let exe = std::env::current_exe().unwrap();
        assert!(checked_jar(&exe.to_string_lossy()).is_err());
    }
}
