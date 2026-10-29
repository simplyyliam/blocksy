# 0001: One pnpm-workspaces monorepo

- Status: accepted
- Date: 2026-10-29

## Context

Blocksy is a desktop app plus many parts that must stay separate: the project
model, the code generator, loader targets, element and node modules, Model
Studio, GUI Studio, the design system, docs and benchmarks. The plan (section
2.2, rule 4) says modules never reach into each other, and that must be
enforced by lint, not by good intentions. Lint can only enforce boundaries it
can see, so each part needs a clear edge.

## Decision

- One repository using **pnpm workspaces**: `apps/desktop` plus small internal
  packages under `packages/`, laid out as in plan section 2.3.
- Packages are folders, not published libraries. One install, one lockfile,
  one commit per change across them. Each package exposes only `src/index.ts`.
- Shared tooling lives once at the root: `tsconfig.base.json` (strict) with
  project references, one Vitest config, and one ESLint config whose
  `eslint-plugin-boundaries` rules enforce who may import whom.
- No build orchestrator for now. **Add Turborepo only if builds get slow.**

## Consequences

- Adding a feature area means adding a package folder and one reference line in
  the root `tsconfig.json`. Nothing else moves.
- Import mistakes (core importing a feature, anything importing the app,
  reaching into another package's internals) fail `pnpm lint`.
- Packages point `main` at TypeScript source, so there is no per-package build
  step. Vite and Vitest compile them directly.
- Everyone needs pnpm (pinned via `packageManager` in the root `package.json`).
- typescript-eslint cannot load TypeScript 7 yet, so `typescript` is aliased to
  the TS 6 API package and `@typescript/native` provides TS 7's `tsc`. Remove
  the alias once typescript-eslint supports TS 7.
