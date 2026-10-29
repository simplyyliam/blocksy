# Blocksy

Blocksy is a desktop app for making Minecraft mods with nodes, visual editors
and live docs, while teaching Java along the way. It scales from a single
custom block to a full tech mod.

> **Status:** pre-release. The repository is a monorepo scaffold; v0.1
> "Foundation" is next.

## Stack

Tauri 2 (thin Rust layer) · React + TypeScript + Vite · pnpm workspaces

## Getting started

Requirements: Node 24+, pnpm 10, Rust (stable) and the
[Tauri prerequisites](https://tauri.app/start/prerequisites/) for your OS.

```sh
pnpm install
pnpm dev        # start the desktop app
```

Other commands: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.

## Repository

| Path | What it is |
| --- | --- |
| `apps/desktop` | The Tauri desktop app |
| `packages/*` | Internal packages (core, generator, loader targets, editors, UI, docs) |
| `docs/release` | The release plan: what Blocksy is and the order it is built in |
| `docs/decisions` | Architecture decision records |

## License

Not yet chosen.
