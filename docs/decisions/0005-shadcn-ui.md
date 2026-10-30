# 0005: shadcn/ui for every UI component, left as installed

- Status: accepted
- Date: 2026-10-30

## Context

The project started with shadcn/ui initialised (style `base-luma`, Base UI
underneath). The first session removed it and hand-wrote its own Button, Select,
Dialog and so on. That meant more code to own, behaviour to re-test, and drift
from a component set that is well documented and widely known. Later, edits made
inside the copied shadcn files also made upgrades and comparisons hard.

## Decision

- **Every UI piece is a shadcn/ui component** (plus AI Elements, which is a shadcn
  registry). A Blocksy-only component is written only when shadcn has nothing
  that fits (today: `PixelLoader`, `ElapsedTime`), and its header says why.
- Components live in `packages/ui/src/components/ui/` (AI Elements in
  `components/ai-elements/`), configured by `packages/ui/components.json`, and are
  exported from `packages/ui/src/index.ts`. The app imports only `@blocksy/ui`.
- **Installed files are never edited.** The Blocksy look comes from:
  - theme tokens (`theme/modern.ts`): radius scale, text sizes, shadows, colours;
  - shadcn's CSS variables in `styles.css`, which point at those tokens, so the
    Modern and (later) Minecraft themes restyle shadcn with no extra work;
  - props and `className` where a component is used (`size="sm"`, `--sidebar-width`).
- One known CLI bug is fixed after every `add`: it writes `import { cn } from "cn"`
  and installs an unrelated `cn` package. The import is pointed at
  `@blocksy/ui/lib/utils` and the package removed.

## Consequences

- Updating a component is `shadcn add <name> --overwrite` with no merge work.
- Design changes happen in tokens, not in dozens of component files.
- Some exact Figma details (e.g. fully round pills) give way to the stock shapes
  unless a token or a `className` at the use site can express them.
- CLAUDE.md carries the rule so future sessions don't hand-roll components again.
