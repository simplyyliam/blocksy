// The tab strip above the canvas: one tab per open element or view (Overview, Library,
// History, Docs). Built like VS Code's and Zed's, so 20 tabs break nothing:
//   - tabs shrink from 200px to 96px, then the row scrolls sideways (mouse wheel too), with a
//     fade on the edge that has more; the selected tab always scrolls into view
//   - a ⌄ button lists every tab, so none is ever out of reach
//   - × closes (middle-click too); a pinned tab shows a pin instead, sits on the left and
//     survives "Close others"; a dot means "changed since the last build" and becomes × on hover
// Custom (not shadcn Tabs) because shadcn's Tabs has no closable, pinnable or scrolling tabs.
// The mode controls are NOT in this row any more: see editor-toolbar.tsx.
//
//   [📌 Overview] [▣ Ruby Block ●] [◆ Berry Dough ×] [⇄ Berry smelting ×] …        ⌄
import { BookOpen, ChevronDown, History, LayoutDashboard, Library, Pin, PinOff, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import {
  cn, ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger, DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger, Tooltip, TooltipContent, TooltipTrigger,
} from "@blocksy/ui"
import { changedSinceBuild, useBuilt } from "../../shared/stores/built"
import { DOCS, HISTORY, LIBRARY, OVERVIEW, useEditor } from "../../shared/stores/editor"
import { useProject } from "../../shared/stores/project"
import { ElementIcon } from "./element-icon"

const VIEW_META: Record<string, { label: string; Icon: typeof History }> = {
  [OVERVIEW]: { label: "Overview", Icon: LayoutDashboard },
  [LIBRARY]: { label: "Library", Icon: Library },
  [HISTORY]: { label: "History", Icon: History },
  [DOCS]: { label: "Docs", Icon: BookOpen },
}

export function TabStrip() {
  const project = useProject((s) => s.current)
  const tabs = useEditor((s) => s.tabs)
  const pinned = useEditor((s) => s.pinned)
  const selected = useEditor((s) => s.selected)
  const select = useEditor((s) => s.select)
  const closeTab = useEditor((s) => s.closeTab)
  const closeOthers = useEditor((s) => s.closeOthers)
  const pin = useEditor((s) => s.pin)
  const unpin = useEditor((s) => s.unpin)
  const snapshot = useBuilt((s) => s.snapshot)
  const scroller = useRef<HTMLDivElement>(null)
  const active = useRef<HTMLDivElement>(null)
  // Is there more to scroll to on each side? Drives the edge fades.
  const [more, setMore] = useState({ left: false, right: false })

  const measure = () => {
    const el = scroller.current
    if (!el) return
    const left = el.scrollLeft > 1
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
    setMore((m) => (m.left === left && m.right === right ? m : { left, right }))
  }

  // Keep the selected tab in view when many are open, and re-measure when tabs come or go.
  useEffect(() => {
    active.current?.scrollIntoView({ block: "nearest", inline: "nearest" })
    measure()
  }, [selected, tabs])
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  if (!project) return null

  const describe = (id: string) => {
    const element = project.doc.elements.find((e) => e.id === id)
    const meta = VIEW_META[id]
    return { element, label: meta?.label ?? element?.name ?? id, changed: changedSinceBuild(snapshot, element) }
  }
  const icon = (id: string, element: ReturnType<typeof describe>["element"], className: string) => {
    const meta = VIEW_META[id]
    if (meta) return <meta.Icon className={cn("size-3.5 shrink-0", className)} strokeWidth={1.75} />
    return <ElementIcon element={element} project={project.doc} className="size-4 bg-transparent" />
  }

  // The fade is a mask on the scrolling row: transparent for 16px at the edge that has more.
  const fade = `linear-gradient(to right, ${more.left ? "transparent, #000 16px" : "#000, #000"}, ${more.right ? "#000 calc(100% - 16px), transparent" : "#000, #000"})`

  return (
    <div className="flex h-(--b-tab-h) shrink-0 items-stretch border-b border-line-subtle">
      <div
        ref={scroller}
        role="tablist"
        aria-label="Open tabs"
        onScroll={measure}
        // A vertical wheel scrolls the row sideways, like VS Code.
        onWheel={(e) => {
          if (scroller.current && Math.abs(e.deltaY) > Math.abs(e.deltaX)) scroller.current.scrollLeft += e.deltaY
        }}
        style={{ maskImage: fade, WebkitMaskImage: fade }}
        className="flex min-w-0 flex-1 items-stretch overflow-x-auto [scrollbar-width:none]"
      >
        {tabs.map((id) => {
          const { element, label, changed } = describe(id)
          const isActive = id === selected
          const isPinned = pinned.includes(id)
          return (
            <ContextMenu key={id}>
              <ContextMenuTrigger
                render={
                  <div
                    ref={isActive ? active : undefined}
                    role="tab"
                    tabIndex={0}
                    aria-selected={isActive}
                    title={label}
                    onClick={() => select(id)}
                    onAuxClick={(e) => {
                      if (e.button !== 1) return
                      e.preventDefault()
                      closeTab(id)
                    }}
                    onMouseDown={(e) => e.button === 1 && e.preventDefault() /* no autoscroll cursor */}
                    onKeyDown={(e) => e.target === e.currentTarget && (e.key === "Enter" || e.key === " ") && select(id)}
                    className={cn(
                      // 96-200px wide, 13px text, padding 0 10, gap 6 (docs/design/shell-spec.md).
                      "group relative flex h-full w-50 max-w-50 min-w-24 shrink cursor-default items-center gap-1.5 px-2.5 text-sm outline-none transition-colors",
                      "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset",
                      isPinned && "w-auto max-w-40 shrink-0",
                      isActive ? "bg-bg text-fg" : "text-fg-muted hover:bg-surface-hover/60 hover:text-fg",
                    )}
                  />
                }
              >
                {isActive && <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 bg-brand" />}
                {icon(id, element, "")}
                <span className="min-w-0 flex-1 truncate">{label}</span>
                <button
                  type="button"
                  aria-label={isPinned ? `Unpin ${label}` : changed ? `Close ${label} (changed since the last build)` : `Close ${label}`}
                  tabIndex={-1}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (isPinned) unpin(id)
                    else closeTab(id)
                  }}
                  className="relative grid size-4 shrink-0 place-items-center rounded-sm text-fg-faint transition-colors hover:bg-surface-hover hover:text-fg"
                >
                  {isPinned ? (
                    <>
                      <Pin className="size-3 group-hover:hidden" strokeWidth={2} />
                      <PinOff className="hidden size-3 group-hover:block" strokeWidth={2} />
                    </>
                  ) : (
                    <>
                      {/* Changed since the last build: a dot that turns into × while hovered. */}
                      {changed && <span aria-hidden className="size-1.5 rounded-full bg-brand group-hover:hidden" />}
                      <X className={cn("size-3", changed ? "hidden group-hover:block" : !isActive && "opacity-0 group-hover:opacity-100")} strokeWidth={2} />
                    </>
                  )}
                </button>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-48">
                <ContextMenuItem onClick={() => closeTab(id)}>
                  <X strokeWidth={1.75} /> Close
                </ContextMenuItem>
                <ContextMenuItem disabled={tabs.filter((t) => t !== id && !pinned.includes(t)).length === 0} onClick={() => closeOthers(id)}>
                  Close others
                </ContextMenuItem>
                <ContextMenuSeparator />
                {isPinned ? (
                  <ContextMenuItem onClick={() => unpin(id)}>
                    <PinOff strokeWidth={1.75} /> Unpin
                  </ContextMenuItem>
                ) : (
                  <ContextMenuItem onClick={() => pin(id)}>
                    <Pin strokeWidth={1.75} /> Pin
                  </ContextMenuItem>
                )}
              </ContextMenuContent>
            </ContextMenu>
          )
        })}
      </div>

      {/* The list of every open tab: with 20 open, this is how to reach any of them. */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger
            render={
              <DropdownMenuTrigger
                aria-label="Open tabs"
                className="grid w-8 shrink-0 place-items-center text-fg-muted outline-none hover:bg-surface-hover/60 hover:text-fg focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
              />
            }
          >
            <ChevronDown className="size-4" strokeWidth={1.75} />
          </TooltipTrigger>
          <TooltipContent>Open tabs ({tabs.length})</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end" className="max-h-80 w-56 overflow-y-auto">
          {tabs.map((id) => {
            const { element, label, changed } = describe(id)
            return (
              <DropdownMenuItem key={id} onClick={() => select(id)} className={cn("gap-2", id === selected && "bg-surface-hover")}>
                {icon(id, element, "text-fg-muted")}
                <span className="min-w-0 flex-1 truncate">{label}</span>
                {pinned.includes(id) && <Pin className="size-3 text-fg-faint" strokeWidth={2} />}
                {changed && <span aria-label="Changed since the last build" className="size-1.5 rounded-full bg-brand" />}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

