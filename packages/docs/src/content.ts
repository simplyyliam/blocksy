// The Docs content: MDX files in packages/docs/content, compiled by the fumadocs-mdx
// Vite plugin (its macro turns this call into imports of every page and meta.json).
// Pages load lazily (async), so opening the Docs doesn't parse every page at once.
import { defineDocs } from "fumadocs-mdx/macro"

export const docs = defineDocs({
  dir: "packages/docs/content",
  docs: { async: true },
})
