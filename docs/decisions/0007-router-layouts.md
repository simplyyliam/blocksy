# 0007: react-router with layout routes

- Status: accepted
- Date: 2026-10-30

## Context

v0.1 switched pages with a `page` value in a store. v0.2 adds a project editor that must
not show the app's icon rail, and every project should open in the same frame. Liam asked
for `react-router-dom` with layout components and `<Outlet>`s.

## Decision

- `react-router-dom` 7 with a **memory router** (`app/router.tsx`): a desktop window has no address bar.
- Two layout routes:
  - `AppLayout` (icon rail + titlebar): `/` Home, `/docs/*` Docs, `/jdk` JDK setup.
  - `ProjectLayout` (no rail): `/project/:projectId` (the project folder, URL-encoded),
    with a back button at the top left beside the project breadcrumb, Build/Run/Export,
    the editor in the outlet, the build log and the status bar.
- The navigation store stays the one way features move around (`go("docs")`,
  `openDocs(path)`); the router connects itself to it and mirrors `page` from the URL.
  v0.1 features keep working unchanged.
- Docs paths are router paths (`/docs/learn/...`), handed to Fumadocs through its
  `FrameworkProvider` (usePathname/useRouter/Link), so Docs need no router of their own.

## Consequences

- Later editors (Blueprint canvas, Model Studio, GUI Studio) become child routes of
  `ProjectLayout`, e.g. `/project/:projectId/models/:modelId`.
- Tests and the bench can still call `go(...)`; without a router it just sets `page`.
