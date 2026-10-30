# 0004: Generated bindings, one error shape, gated updater

- Status: accepted
- Date: 2026-10-30

## Context

The frontend talks to Rust for files, processes (Gradle, the game) and updates.
Hand-written `invoke("name", args)` calls drift from the Rust signatures and fail
only at runtime. Errors also need one shape the UI can show calmly. And a
self-updating app must never update itself with an unsigned build.

## Decision

- **tauri-specta generates `apps/desktop/src/shared/bindings.ts`** (typed
  `commands` and events) from the Rust code on every debug run and `cargo test`.
  It is never edited by hand, and lint forbids calling Tauri's `invoke` directly.
- **Every command returns `AppError { code, message }`** on failure. `code` is a
  snake_case `ErrorCode` the UI can branch on (`not_found`, ...); `message` is
  plain words for the user. Frontend helpers (`call`, `CommandError`) unwrap it.
- Long tasks talk back through typed **events**: `GradleOutput`, `GradleFinished`,
  `UpdateStatus`.
- The **updater is off unless a signing key exists**. `pnpm updater:keygen`
  creates the key (kept in `.private/`, never committed), the public key goes in
  `tauri.conf.json`, and `pnpm release` makes signed draft releases with `latest.json`.

## Consequences

- Renaming a Rust command breaks `pnpm typecheck` immediately instead of at runtime.
- New commands must use `AppResult` so the error shape stays the same everywhere.
- Builds without the key simply show "Automatic updates are off in this build".
- The full update path (install 0.1.0, release 0.1.1, it updates itself) is checked
  by hand with `docs/release/updater-test.md` before each release.
