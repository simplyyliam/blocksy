// The Library: a read-only reference of every vanilla item and block item id (the activity
// bar's third view, like MCreator's element reference). Search, click a row to copy its id for
// a recipe or tag. It reads the same id list as the item picker; no new data (UI only).
//   Library                                  [ search ]
//   ▣ Wheat          wheat                        (click: copy minecraft:wheat)
import { Copy } from "lucide-react"
import { useDeferredValue, useMemo, useState } from "react"
import { prettyId, RefTile, VANILLA_ITEMS } from "@blocksy/game-data"
import { Input, toast } from "@blocksy/ui"
import { useProject } from "../../shared/stores/project"

/** Rows drawn at once; the search narrows the rest (about 1,500 ids exist). */
const SHOWN = 200

export function Library() {
  const project = useProject((s) => s.current)
  const [query, setQuery] = useState("")
  const deferred = useDeferredValue(query)
  const matches = useMemo(() => {
    const q = deferred.trim().toLowerCase().replace(/^minecraft:/, "").replaceAll(" ", "_")
    return q ? VANILLA_ITEMS.filter((id) => id.includes(q)) : VANILLA_ITEMS
  }, [deferred])
  if (!project) return null

  const copy = (id: string) => {
    void navigator.clipboard.writeText(`minecraft:${id}`).then(
      () => toast.success(`Copied minecraft:${id}`),
      () => toast.error("Could not copy to the clipboard"),
    )
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3 px-6 py-5">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-lg font-medium text-fg">Library</h1>
          <p className="text-sm text-fg-muted">Every vanilla item and block id. Click one to copy it.</p>
        </div>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && setQuery("")}
          spellCheck={false}
          aria-label="Search the library"
          placeholder={`Search ${VANILLA_ITEMS.length} ids`}
          className="h-7 w-56"
        />
      </header>
      <ul aria-label="Vanilla ids" className="grid grid-cols-2 gap-x-3 gap-y-px max-md:grid-cols-1">
        {matches.slice(0, SHOWN).map((id) => (
          <li key={id}>
            <button
              type="button"
              onClick={() => copy(id)}
              className="group flex h-(--b-row-h) w-full items-center gap-2 rounded-md px-1.5 text-left text-sm outline-none hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <RefTile refValue={`minecraft:${id}`} project={project.doc} className="size-4.5" />
              <span className="min-w-0 flex-1 truncate text-fg">{prettyId(id)}</span>
              <span className="truncate font-mono text-[11px] text-fg-faint">{id}</span>
              <Copy className="size-3 shrink-0 text-fg-faint opacity-0 group-hover:opacity-100" strokeWidth={1.75} />
            </button>
          </li>
        ))}
      </ul>
      {matches.length === 0 && <p className="py-8 text-center text-sm text-fg-muted">Nothing matches “{query}”.</p>}
      {matches.length > SHOWN && (
        <p className="py-2 text-center text-xs text-fg-faint">
          Showing {SHOWN} of {matches.length}. Type to narrow it down.
        </p>
      )}
    </div>
  )
}
