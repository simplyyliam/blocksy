// @blocksy/docs: the in-app Docs. Fumadocs behind a thin adapter (<DocsApp>), MDX
// content in ../content (Diátaxis: Learn, Guides, Reference, Concepts, Community),
// generated Reference pages, live demos and the credits.
// Public API of this package. Other packages may import only from here
// (plus `@blocksy/docs/docs.css`, which the app imports once).
// The Docs app (Fumadocs, MDX, a big bundle) is loaded on demand: importing this package for the
// light data below never pulls it in.
export const loadDocsApp = () => import("./docs-app.tsx")
export type { DocsHost } from "./context.ts"
// The light, React-free data: lessons, community links, credits.
export * from "./data.ts"
