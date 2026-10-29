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
