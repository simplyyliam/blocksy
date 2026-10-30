// @blocksy/docs: the in-app Docs. Fumadocs behind a thin adapter (<DocsApp>), MDX
// content in ../content (Diátaxis: Learn, Guides, Reference, Concepts, Community),
// generated Reference pages, live demos and the credits.
// Public API of this package. Other packages may import only from here
// (plus `@blocksy/docs/docs.css`, which the app imports once).
export { DocsApp } from "./docs-app.tsx"
export type { DocsHost } from "./context.ts"
export { CREDITS, FEATURED } from "./credits.ts"
