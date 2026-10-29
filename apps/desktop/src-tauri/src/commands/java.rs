//! JDK detection: finds installed Java runtimes and reports their versions.
//! Which one is "good enough" for a project is decided in TypeScript.

use std::collections::HashSet;
use std::path::{Path, PathBuf};

use serde::Serialize;
use specta::Type;

use crate::error::AppResult;
use crate::process::quiet_command;

#[derive(Debug, Clone, Serialize, Type)]
pub struct JavaInstall {
    /// The JDK folder (the one that contains `bin/`). Used as JAVA_HOME for Gradle.
    pub home: String,
    /// Full version, e.g. "25.0.2".
    pub version: String,
    /// Major version, e.g. 25.
    pub major: u32,
    pub vendor: String,
    /// Has `javac`, so it's a full JDK (Gradle needs a JDK, not just a JRE).
    pub is_jdk: bool,
}

fn exe(name: &str) -> String {
    if cfg!(windows) { format!("{name}.exe") } else { name.to_string() }
}

/// Asks a `java` binary for its properties and parses the interesting ones.
fn inspect(java: &Path) -> Option<JavaInstall> {
    let out = quiet_command(java).args(["-XshowSettings:properties", "-version"]).output().ok()?;
    let text = String::from_utf8_lossy(&out.stderr);
    let prop = |key: &str| {
        text.lines()
            .find_map(|l| l.trim().strip_prefix(key).and_then(|r| r.trim().strip_prefix('=')))
            .map(|v| v.trim().to_string())
    };
    let version = prop("java.version")?;
    let home = prop("java.home")?;
    // "25.0.2" -> 25, old style "1.8.0_402" -> 8
    let mut parts = version.split(['.', '_', '-', '+']);
    let first: u32 = parts.next()?.parse().ok()?;
    let major = if first == 1 { parts.next()?.parse().ok()? } else { first };
    let is_jdk = Path::new(&home).join("bin").join(exe("javac")).exists();
    Some(JavaInstall { home, version, major, vendor: prop("java.vendor").unwrap_or_default(), is_jdk })
}

/// Folders where JDK installers usually put things, per OS.
fn common_homes() -> Vec<PathBuf> {
    let roots: Vec<PathBuf> = if cfg!(windows) {
        let pf = std::env::var("ProgramFiles").unwrap_or_else(|_| r"C:\Program Files".into());
        ["Eclipse Adoptium", "Java", "Microsoft", "Zulu", "BellSoft", "Amazon Corretto", "Semeru"]
            .iter()
            .map(|v| Path::new(&pf).join(v))
            .collect()
    } else if cfg!(target_os = "macos") {
        vec!["/Library/Java/JavaVirtualMachines".into()]
    } else {
        vec!["/usr/lib/jvm".into()]
    };
    let mut homes = Vec::new();
    for root in roots {
        let Ok(entries) = std::fs::read_dir(root) else { continue };
        for entry in entries.flatten() {
            let path = entry.path();
            homes.push(if cfg!(target_os = "macos") { path.join("Contents/Home") } else { path });
        }
    }
    homes
}

/// Finds Java installs: the configured one, JAVA_HOME, `java` on PATH and common folders.
#[tauri::command]
#[specta::specta]
pub async fn detect_java(configured_home: Option<String>) -> AppResult<Vec<JavaInstall>> {
    tauri::async_runtime::spawn_blocking(move || {
        let mut candidates: Vec<PathBuf> = Vec::new();
        if let Some(home) = configured_home.filter(|h| !h.is_empty()) {
            candidates.push(Path::new(&home).join("bin").join(exe("java")));
        }
        if let Ok(home) = std::env::var("JAVA_HOME") {
            candidates.push(Path::new(&home).join("bin").join(exe("java")));
        }
        candidates.push(PathBuf::from(exe("java"))); // whatever is on PATH
        candidates.extend(common_homes().into_iter().map(|h| h.join("bin").join(exe("java"))));

        let mut seen = HashSet::new();
        let mut found = Vec::new();
        for java in candidates {
            if let Some(install) = inspect(&java) {
                let key = std::fs::canonicalize(&install.home).unwrap_or_else(|_| install.home.clone().into());
                if seen.insert(key) {
                    found.push(install);
                }
            }
        }
        Ok(found)
    })
    .await
    .unwrap_or_else(|e| Err(crate::error::AppError::new(crate::error::ErrorCode::Internal, e.to_string())))
}
