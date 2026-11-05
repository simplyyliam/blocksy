// The inspector's Code tab: the generated Java (or JSON) that belongs to the selected element,
// read-only and live. It runs the same pure generator as Build, so what you read is what gets built.
import { useMemo } from "react"
import { generate } from "@blocksy/generator"
import { CodeView, languageOf } from "@blocksy/ui"
import type { Element } from "@blocksy/core"
import { registries } from "../../app/modules"
import { useProject } from "../../shared/stores/project"

/** Which generated file explains an element best (matches the full Code view's choice). */
function filesFor(paths: string[], element: Element): string[] {
  const id = element.id
  const byEnd = (...ends: string[]) => paths.filter((p) => ends.some((e) => p.endsWith(e)))
  if (element.type === "block") return [...byEnd("/ModBlocks.java"), ...paths.filter((p) => p.includes(`/${id}.json`) && p.includes("blockstates"))]
  if (element.type === "item") return [...byEnd("/ModItems.java"), ...paths.filter((p) => p.endsWith(`/${id}.json`) && p.includes("/items/"))]
  if (element.type === "creative_tab") return byEnd("/ModCreativeTabs.java")
  return paths.filter((p) => p.includes(`/${id}.json`))
}

export function InspectorCode({ element }: { element: Element }) {
  const doc = useProject((s) => s.current?.doc)
  const files = useMemo(() => {
    if (!doc) return []
    try {
      const all = generate(doc, registries)
      const wanted = filesFor(all.map((f) => f.path), element)
      return all.filter((f) => wanted.includes(f.path) && "contents" in f)
    } catch {
      return []
    }
  }, [doc, element])

  if (files.length === 0) return <p className="px-3 py-3 text-xs text-fg-faint">No generated file for this element yet. Build once, or see the full Code view.</p>
  return (
    <div className="flex flex-col">
      {files.map((f) => (
        <section key={f.path} className="border-b border-line-subtle">
          <p className="truncate bg-surface-hover/50 px-3 py-1 font-mono text-[11px] text-fg-muted" title={f.path} data-selectable>
            {f.path.slice(f.path.lastIndexOf("/") + 1)} · read-only
          </p>
          {"contents" in f && <CodeView code={f.contents} language={languageOf(f.path)} className="max-h-96 px-2 py-1 text-[11px]" />}
        </section>
      ))}
    </div>
  )
}
