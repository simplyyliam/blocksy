// Fabric adapter for the Tag and Language elements (ADR 0009). Both can share a file with
// another element (two Tags adding to minecraft:planks, two Languages for de_de), so their
// adapters write nothing themselves; templates/content.ts merges them into one file each:
//   data/<namespace>/tags/<item|block>/<path>.json    { "values": [...] }
//   assets/<modid>/lang/<locale>.json                 { "key": "text" }
import type { Element, GenerateContext } from "@blocksy/core"
import { resolveRef, tagId } from "./refs.ts"

export type TagElement = Element & { data: { registry: "item" | "block"; target: string | null; values: string[] } }
export type LanguageElement = Element & { data: { locale: string; entries: Record<string, string> } }

/** The adapter for tags and languages: everything lives in merged files. */
export const mergedTemplate = () => []

/** Every tag file, merged by path. Entries that point at deleted elements are left out. */
export function tagFiles(tags: TagElement[], ctx: GenerateContext): { path: string; contents: string }[] {
  const byPath = new Map<string, string[]>()
  for (const tag of tags) {
    const id = tagId(tag, ctx.project.modId)
    const [ns, path] = [id.slice(0, id.indexOf(":")), id.slice(id.indexOf(":") + 1)]
    const file = `${ctx.paths.resources}/data/${ns}/tags/${tag.data.registry}/${path}.json`
    const values = tag.data.values.map((v) => resolveRef(v, ctx.project)).filter((v): v is string => v !== null && v !== `#${id}`)
    byPath.set(file, [...new Set([...(byPath.get(file) ?? []), ...values])])
  }
  // "replace" is left out (false): Minecraft adds our values to any other pack's.
  return [...byPath]
    .filter(([, values]) => values.length > 0)
    .map(([path, values]) => ({ path, contents: `${JSON.stringify({ values }, null, 2)}\n` }))
}

/** Translations per locale, merged in project order (later elements win). Empty text is skipped. */
export function translations(languages: LanguageElement[]): Map<string, Record<string, string>> {
  const out = new Map<string, Record<string, string>>()
  for (const lang of languages) {
    const filled = Object.entries(lang.data.entries).filter(([, text]) => text.trim() !== "")
    out.set(lang.data.locale, { ...(out.get(lang.data.locale) ?? {}), ...Object.fromEntries(filled) })
  }
  return out
}
