# 0002: Stack and pinned versions

- Status: accepted
- Date: 2026-10-30

## Context

Blocksy is a desktop app that must start fast, stay small, and run the same on
every machine. The plan (sections 2 and 4) asks for a thin native shell, product
logic in TypeScript, and a 3D viewport later (Model Studio). Versions drift fast
in this ecosystem, so "latest" is not a decision; each choice needs a pin and a
reason.

## Decision

| Layer | Choice | Why |
| --- | --- | --- |
| Shell | **Tauri 2.11** (Rust) | Small binaries, system WebView2, Rust only for files, processes, git and dialogs (rule 8) |
| UI | **React 19.3** | React Three Fiber **9** is the major that supports React 19 (peer `>=19 <19.4`, checked on npm 2026-10-30) |
| Build | **Vite 8** (Rolldown), React Compiler on | Fast dev server; the compiler removes most manual memoisation |
| Language | **TypeScript 7** for `tsc`; `typescript` aliased to the TS 6 API | typescript-eslint cannot load TS 7 yet (see ADR 0001) |
| Bindings | **tauri-specta `=2.0.0-rc.26`** (pinned RC) | Typed `commands` and events generated from Rust; the RC is pinned exactly because RCs can break between releases |
| Components | **shadcn/ui** (style `base-luma`, **Base UI** underneath) + Tailwind 4 | See ADR 0005 |
| State | **zustand 5** | Small stores with selectors; no provider tree |
| Mod toolchain | Fabric: Loom **1.19.3** (not SNAPSHOT), loader **0.20.1**, Gradle **9.8.2**, Java **25**; Minecraft 26.1.2 and 26.3 | Every pin is proven by a real `pnpm test:gradle` build before it ships |

## Consequences

- Upgrading any pinned version is a deliberate change: bump it, run the full
  checks (and `pnpm test:gradle` for the toolchain), and note it here or in a new ADR.
- React stays below 19.4 until React Three Fiber supports it.
- When tauri-specta 2.0 is final, move off the RC and drop the exact pin.
- Remove the TypeScript alias once typescript-eslint supports TS 7.
