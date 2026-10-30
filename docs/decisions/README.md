# Architecture decision records

An ADR is a short note that records one architectural choice: why it came up,
what was decided, and what follows from it. They are never rewritten later; a
changed decision gets a new ADR that supersedes the old one.

## Template

Copy this into `NNNN-short-title.md`, using the next free number.

```markdown
# NNNN: Title

- Status: proposed | accepted | superseded by NNNN
- Date: YYYY-MM-DD

## Context

What problem or force made a decision necessary.

## Decision

What we chose, in plain words.

## Consequences

What becomes easier, harder, or must now be done.
```

## Index

| ADR | Title | Status |
| --- | --- | --- |
| [0001](0001-monorepo.md) | One pnpm-workspaces monorepo | accepted |
| [0002](0002-stack-and-versions.md) | Stack and pinned versions | accepted |
| [0003](0003-registries.md) | Registries as the only way modules plug in | accepted |
| [0004](0004-bindings-errors-updater.md) | Generated bindings, one error shape, gated updater | accepted |
| [0005](0005-shadcn-ui.md) | shadcn/ui for every UI component, left as installed | accepted |
| [0006](0006-element-adapters-and-datagen.md) | Loader code for elements lives in the target; Fabric data generation | accepted |
| [0007](0007-router-layouts.md) | react-router with layout routes | accepted |
