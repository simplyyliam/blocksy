// The Code tab: every file Blocksy writes for this project, read-only, live.
// It runs the same pure generator as Build, so what you read here is exactly what gets
// built. Selecting a block jumps to the file that registers it (ModBlocks.java).
//
//   ┌──────────────┬──────────────────────────────────┐
//   │ files        │  1  package com.example...        │
//   │ ▸ ModBlocks  │  2                                │
//   └──────────────┴──────────────────────────────────┘
import { useMemo, useState } from "react"
import { generate } from "@blocksy/generator"
import { cn, CodeView, DotMatrix, languageOf } from "@blocksy/ui"
import { registries } from "../../app/modules"
import { useEditor } from "../../shared/stores/editor"
import { useProject } from "../../shared/stores/project"

/** Plumbing nobody needs to read (wrapper scripts and jar). */
const HIDDEN = /^(gradlew(\.bat)?|gradle\/wrapper\/.*)$/

const fileName = (path: string) => path.slice(path.lastIndexOf("/") + 1)

/** The file that best explains the selected element. */
function preferredFile(paths: string[], selectedType: string | undefined): string | undefined {
  const byName = (name: string) => paths.find((p) => p.endsWith(`/${name}`))
  if (selectedType === "block") return byName("ModBlocks.java")
  if (selectedType === "creative_tab") return byName("ModCreativeTabs.java")
  // Overview: the mod's main class (onInitialize).
  return paths.find((p) => p.endsWith(".java") && !/\/(client|block|item)\//.test(p))
}

export function CodeTab() {
  const doc = useProject((s) => s.current?.doc)
  const selected = useEditor((s) => s.selected)
  const [picked, setPicked] = useState<string | null>(null)

  const result = useMemo(() => {
    if (!doc) return { files: [], error: null }
    try {
      return { files: generate(doc, registries).filter((f) => !HIDDEN.test(f.path)), error: null }
    } catch (err) {
      return { files: [], error: err instanceof Error ? err.message : String(err) }
    }
  }, [doc])

  if (result.error) {
    return (
      <div className="grid size-full place-items-center p-8 text-center">
        <div className="flex max-w-md flex-col items-center gap-3">
          <DotMatrix state="error" className="size-6 text-danger" />
          <p className="text-sm text-fg">Blocksy can't write this project yet</p>
          <p className="text-xs whitespace-pre-line text-fg-muted">{result.error}</p>
        </div>
      </div>
    )
  }

  const paths = result.files.map((f) => f.path)
  const selectedType = doc?.elements.find((e) => e.id === selected)?.type
  const current = (picked && paths.includes(picked) ? picked : null) ?? preferredFile(paths, selectedType) ?? paths[0]
  const file = result.files.find((f) => f.path === current)

  return (
    <div className="flex size-full min-h-0">
      <ul className="flex w-[232px] shrink-0 flex-col gap-px overflow-y-auto py-3 pr-2 pl-3" aria-label="Generated files">
        {result.files.map((f) => (
          <li key={f.path}>
            <button
              type="button"
              title={f.path}
              onClick={() => setPicked(f.path)}
              className={cn(
                "flex h-7 w-full flex-col justify-center rounded-md px-2 text-left text-xs hover:bg-surface-hover",
                f.path === current ? "bg-surface-hover text-fg" : "text-fg-muted",
              )}
            >
              <span className="truncate">{fileName(f.path)}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate px-4 pt-3 pb-2 font-mono text-xs text-fg-faint" title={current} data-selectable>
          {current} · read-only
        </p>
        {file && "contents" in file && <CodeView key={file.path} code={file.contents} language={languageOf(file.path)} className="min-h-0 flex-1 px-4 pb-20" />}
        {file && "base64" in file && (
          <div className="grid flex-1 place-items-center">
            <img src={`data:image/png;base64,${file.base64}`} alt={fileName(file.path)} className="size-32 [image-rendering:pixelated]" />
          </div>
        )}
      </div>
    </div>
  )
}
