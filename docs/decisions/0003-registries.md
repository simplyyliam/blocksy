# 0003: Registries as the only way modules plug in

- Status: accepted
- Date: 2026-10-30

## Context

Blocksy grows from one block to a full tech mod by adding modules: element types,
node families, GUI components, model formats, Model Studio tools, loader targets,
themes and docs demos. Rule 4 says modules never reach into each other. Something
has to let the app find a module without importing its internals, and let a new
module arrive without editing the ones already there.

## Decision

- `packages/core/src/registries.ts` defines **eight registries**: element types,
  node types, GUI components, model formats, Model Studio tools, loader targets,
  themes and docs demos. Each is a small typed map: `register`, `get`, `list`.
- Modules are registered in **one place**: `apps/desktop/src/app/modules.ts`.
  Adding a module = one import + one `register` line there.
- Element templates are keyed by **target id** (e.g. `fabric`), so `core` never
  names a loader (rule 5) and a new loader adds templates without touching elements.
- Registry entry shapes only **grow by optional fields**. A required field would
  break every module already registered, so it needs a new ADR.

## Consequences

- The generator, the UI and the docs all ask registries ("which loader targets
  exist?") instead of importing modules, so lint can keep the boundaries strict.
- A dummy element test in the generator proves the promise: one folder + one
  registration line is all a new element needs.
- Order of registration is the default order in the UI (e.g. the first loader
  target is the default in New project).
