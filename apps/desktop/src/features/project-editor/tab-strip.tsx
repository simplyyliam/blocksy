// The tab strip above the canvas: one tab per open element (block, its item, its recipe
// side by side). Click selects, the × or a middle click closes, right-click offers Close
// and Close others. Custom (not shadcn Tabs) because shadcn's Tabs has no closable tabs.
//
//   [▣ Ruby Block ×] [◆ Berry Dough ×] [⇄ Berry smelting ×]
import { History, LayoutDashboard, X } from "lucide-react"
import { useEffect, useRef } from "react"
import { cn, ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@blocksy/ui"
import { HISTORY, OVERVIEW, useEditor } from "../../shared/stores/editor"
import { useProject } from "../../shared/stores/project"
import { ElementIcon } from "./element-icon"

export function TabStrip() {
  const project = useProject((s) => s.current)
  const tabs = useEditor((s) => s.tabs)
  const selected = useEditor((s) => s.selected)
  const select = useEditor((s) => s.select)
  const closeTab = useEditor((s) => s.closeTab)
  const closeOthers = useEditor((s) => s.closeOthers)
  const active = useRef<HTMLDivElement>(null)

  // Keep the selected tab in view when many are open.
  useEffect(() => {
    active.current?.scrollIntoView({ block: "nearest", inline: "nearest" })
  }, [selected])

  if (!project) return null

  return (
    <div role="tablist" aria-label="Open elements" className="flex h-8 min-w-0 flex-1 items-end gap-px overflow-x-auto pt-1 [scrollbar-width:none]">
      {tabs.map((id) => {
        const element = project.doc.elements.find((e) => e.id === id)
        const isActive = id === selected
        const label = id === OVERVIEW ? "Overview" : id === HISTORY ? "History" : (element?.name ?? id)
        return (
          <ContextMenu key={id}>
            <ContextMenuTrigger
              render={
                <div
                  ref={isActive ? active : undefined}
                  role="tab"
                  tabIndex={0}
                  aria-selected={isActive}
                  onClick={() => select(id)}
                  onAuxClick={(e) => e.button === 1 && closeTab(id)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && select(id)}
                  className={cn(
                    "group flex h-7 max-w-44 min-w-0 shrink-0 cursor-default items-center gap-1.5 rounded-t-md pr-1 pl-2 text-sm transition-colors outline-none",
                    "focus-visible:ring-2 focus-visible:ring-ring/50",
                    isActive ? "bg-surface text-fg" : "text-fg-muted hover:bg-surface-hover/60 hover:text-fg",
                  )}
                />
              }
            >
              {id === OVERVIEW ? (
                <LayoutDashboard className="size-3.5 shrink-0" strokeWidth={1.75} />
              ) : id === HISTORY ? (
                <History className="size-3.5 shrink-0" strokeWidth={1.75} />
              ) : (
                <ElementIcon element={element} project={project.doc} className="size-4 bg-transparent" />
              )}
              <span className="truncate">{label}</span>
              <button
                type="button"
                aria-label={`Close ${label}`}
                tabIndex={-1}
                onClick={(e) => {
                  e.stopPropagation()
                  closeTab(id)
                }}
                className={cn(
                  "grid size-4.5 shrink-0 place-items-center rounded-sm text-fg-faint transition-opacity hover:bg-surface-hover hover:text-fg",
                  !isActive && "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
                )}
              >
                <X className="size-3" strokeWidth={2} />
              </button>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-44">
              <ContextMenuItem onClick={() => closeTab(id)}>Close</ContextMenuItem>
              <ContextMenuItem disabled={tabs.length < 2} onClick={() => closeOthers(id)}>
                Close others
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => select(id)}>Show</ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        )
      })}
    </div>
  )
}
