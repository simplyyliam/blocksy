//! Support for `pnpm bench` (packages/bench). The bench runner starts the app with
//! BLOCKSY_BENCH=<report path>; the app then runs its scripted check, hands the
//! report back through `bench_finish` and quits. Normal launches never see this.

use std::sync::OnceLock;
use std::time::Instant;

use crate::error::AppResult;

static STARTED: OnceLock<Instant> = OnceLock::new();

/// Called first thing in `run()`, so uptime counts from process start-up.
pub fn mark_start() {
    STARTED.get_or_init(Instant::now);
}

/// The report path when started by the bench runner, otherwise nothing.
#[tauri::command]
#[specta::specta]
pub fn bench_mode() -> Option<String> {
    std::env::var("BLOCKSY_BENCH").ok().filter(|p| !p.is_empty())
}

/// Milliseconds since the Rust side started.
#[tauri::command]
#[specta::specta]
pub fn app_uptime_ms() -> f64 {
    STARTED.get().map(|t| t.elapsed().as_secs_f64() * 1000.0).unwrap_or(0.0)
}

/// Writes the bench report (JSON from the frontend) and quits the app.
#[tauri::command]
#[specta::specta]
pub fn bench_finish(app: tauri::AppHandle, report: String) -> AppResult<()> {
    if let Some(path) = bench_mode() {
        std::fs::write(path, report)?;
    }
    app.exit(0);
    Ok(())
}
