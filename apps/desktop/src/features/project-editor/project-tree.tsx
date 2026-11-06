// The explorer: the left panel of the project editor. Only the project's lists live here
// (creative tabs, blocks, items, recipes, tags, languages, imported files). Overview, History,
// Library and Docs are views on the activity bar, not rows in this list (ADR 0019).
//
//   ┌──────────────────────┐
//   │ EXPLORER           + │  <- 32px header: new element
//   │ 🔍 Filter elements   │
//   │ ▾ Blocks (2)       + │  <- groups come from the element registry (`plural`)
//   │   ▣ Ruby Block       │  <- real texture icons (the element's own pixels)
//   │ ▾ Items (1)        + │
//   └──────────────────────┘
// A new element type shows up here with no change to this file. Click opens a tab,
// double-click or F2 renames, right-click offers Open, Rename, Duplicate and Delete
// (Ctrl+Z undoes a delete). "+" opens the New element dialog with the type chosen.
import { ChevronRight, Copy, FileAudio, ImageIcon, PencilLine, Plus, Search, Shapes, SquareArrowOutUpRight, Trash2 } from "lucide-react"
import { useState } from "react"
import { removeResource, RESOURCE_INFO, RESOURCE_KINDS, resourcePlace, type Element, type Resource } from "@blocksy/core"
import {
  Button, cn, ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger, Input, Tooltip,
  TooltipContent, TooltipTrigger,
} from "@blocksy/ui"
import { registries } from "../../app/modules"
import { deleteElement, duplicateElement, renameElementTo } from "../../shared/element-actions"
import { useEditor } from "../../shared/stores/editor"
import { useProject } from "../../shared/stores/project"
import { ElementIcon } from "./element-icon"

const row = "h-6 w-full justify-start gap-1.5 rounded-md px-1.5 font-normal"

export function ProjectTree() {
  const project = useProject((s) => s.current)
  const selected = useEditor((s) => s.selected)
  const openNewElement = useEditor((s) => s.openNewElement)
  const [filter, setFilter] = useState("")
  /** Group ids the user folded away (open by default). */
  const [folded, setFolded] = useState<Set<string>>(new Set())
  const [renaming, setRenaming] = useState<string | null>(null)
  if (!project) return null
  const { doc } = project
  const query = filter.trim().toLowerCase()

  const toggle = (id: string) =>
    setFolded((prev) => {
      const next = new Set(prev)
      if (!next.delete(id)) next.add(id)
      return next
    })

  return (
    <div className="flex h-full flex-col">
      {/* Panel header (32px, --b-panel-header-h): the panel's name and the global quick-create. */}
      <div className="flex h-(--b-panel-header-h) shrink-0 items-center justify-between pr-1.5 pl-3">
        <h2 className="text-xs font-medium tracking-wide text-fg-muted uppercase">Explorer</h2>
        <Tooltip>
          <TooltipTrigger render={<Button variant="ghost" size="icon-xs" aria-label="New element" className="text-fg-muted" onClick={() => openNewElement()} />}>
            <Plus strokeWidth={2} />
          </TooltipTrigger>
          <TooltipContent>New element</TooltipContent>
        </Tooltip>
      </div>

      <div className="relative px-2 pb-1.5">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-3.5 -translate-y-1/2 text-fg-faint" strokeWidth={1.75} />
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && setFilter("")}
          spellCheck={false}
          aria-label="Filter elements"
          placeholder="Filter elements"
          className="h-6 pl-7 text-xs"
        />
      </div>

      <nav aria-label="Project" className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto border-t border-line-subtle px-1.5 pt-1.5 pb-3">
        {registries.elementTypes.list().map((type) => {
          const all = doc.elements.filter((e) => e.type === type.id)
          const items = query ? all.filter((e) => e.name.toLowerCase().includes(query)) : all
          if (query && items.length === 0) return null
          const open = query ? true : !folded.has(type.id)
          return (
            <section key={type.id} className="mt-1 flex flex-col gap-px">
              <div className="group/header flex h-5.5 items-center justify-between pr-0.5">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => toggle(type.id)}
                  className="flex h-5.5 min-w-0 flex-1 items-center gap-1 rounded-md pl-0.5 text-left text-xs font-medium tracking-wide text-fg-muted uppercase outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <ChevronRight className={cn("size-3 shrink-0 transition-transform duration-150", open && "rotate-90")} strokeWidth={2} />
                  <span className="truncate">{type.plural ?? type.name}</span>
                  <span className="font-normal text-fg-faint">{all.length}</span>
                </button>
                <Tooltip>
                  <TooltipTrigger
                    render={<Button variant="ghost" size="icon-xs" aria-label={`Add ${type.name.toLowerCase()}`} className="text-fg-muted" onClick={() => openNewElement(type.id)} />}
                  >
                    <Plus strokeWidth={2} />
                  </TooltipTrigger>
                  <TooltipContent>Add {type.name.toLowerCase()}</TooltipContent>
                </Tooltip>
              </div>
              {open && items.length === 0 && <p className="pl-5 pb-1 text-xs text-fg-faint">None yet</p>}
              {open &&
                items.map((element) => (
                  <ElementRow
                    key={element.id}
                    element={element}
                    typeName={type.name.toLowerCase()}
                    active={selected === element.id}
                    renaming={renaming === element.id}
                    onRenaming={setRenaming}
                  />
                ))}
            </section>
          )
        })}

        {/* Imported files (Resources menu or dropped from the desktop), one group per kind. */}
        {RESOURCE_KINDS.map((kind) => {
          const all = (doc.resources ?? []).filter((r) => r.kind === kind)
          const items = query ? all.filter((r) => r.name.includes(query)) : all
          if (items.length === 0) return null
          const id = `resource:${kind}`
          const open = query ? true : !folded.has(id)
          return (
            <section key={kind} className="mt-1 flex flex-col gap-px">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => toggle(id)}
                className="flex h-5.5 items-center gap-1 rounded-md pl-0.5 text-left text-xs font-medium tracking-wide text-fg-muted uppercase outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <ChevronRight className={cn("size-3 shrink-0 transition-transform duration-150", open && "rotate-90")} strokeWidth={2} />
                <span className="truncate">{RESOURCE_INFO[kind].plural}</span>
                <span className="font-normal text-fg-faint">{all.length}</span>
              </button>
              {open && items.map((resource) => <ResourceRow key={resource.name} resource={resource} />)}
            </section>
          )
        })}
      </nav>
    </div>
  )
}

/** An imported file: its name and where it lands in the mod. Right-click removes it (Ctrl+Z brings it back). */
function ResourceRow({ resource }: { resource: Resource }) {
  const project = useProject((s) => s.current)!
  const place = resourcePlace(resource)
  const Icon = resource.kind === "sound" ? FileAudio : resource.kind === "model" ? Shapes : ImageIcon
  return (
    <ContextMenu>
      <ContextMenuTrigger render={<div title={place.path} className={cn(row, "flex items-center gap-1.5 pl-3.5 text-sm text-fg")} />}>
        <span className="grid size-5 shrink-0 place-items-center rounded-[5px] bg-surface text-fg-muted">
          <Icon className="size-3.5" strokeWidth={1.75} />
        </span>
        <span className="truncate">{resource.name}</span>
        <span className="ml-auto shrink-0 text-xs text-fg-faint">.{resource.ext}</span>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem variant="destructive" onClick={() => project.documents.execute(removeResource(resource.kind, resource.name))}>
          <Trash2 strokeWidth={1.75} /> Remove {RESOURCE_INFO[resource.kind].label.toLowerCase()}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

function ElementRow({ element, typeName, active, renaming, onRenaming }: { element: Element; typeName: string; active: boolean; renaming: boolean; onRenaming(id: string | null): void }) {
  const project = useProject((s) => s.current)!
  const select = useEditor((s) => s.select)
  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={
          renaming ? (
            <div className={cn(row, "flex items-center")} />
          ) : (
            <Button
              variant="ghost"
              size="sm"
              aria-current={active ? "true" : undefined}
              className={cn(row, "pl-3.5", active && "bg-surface-hover")}
              onClick={() => select(element.id)}
              onDoubleClick={() => onRenaming(element.id)}
              onKeyDown={(e) => e.key === "F2" && onRenaming(element.id)}
            />
          )
        }
      >
        <ElementIcon element={element} project={project.doc} />
        {renaming ? (
          <Input
            autoFocus
            defaultValue={element.name}
            spellCheck={false}
            aria-label={`Rename ${element.name}`}
            className="h-6 flex-1 text-sm"
            onFocus={(e) => e.currentTarget.select()}
            onBlur={(e) => {
              renameElementTo(element, e.target.value)
              onRenaming(null)
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") e.currentTarget.value = element.name
              if (e.key === "Enter" || e.key === "Escape") e.currentTarget.blur()
            }}
          />
        ) : (
          <span className="truncate">{element.name}</span>
        )}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={() => select(element.id)}>
          <SquareArrowOutUpRight strokeWidth={1.75} /> Open
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onRenaming(element.id)}>
          <PencilLine strokeWidth={1.75} /> Rename
        </ContextMenuItem>
        <ContextMenuItem onClick={() => duplicateElement(element)}>
          <Copy strokeWidth={1.75} /> Duplicate
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" onClick={() => deleteElement(element)}>
          <Trash2 strokeWidth={1.75} /> Delete {typeName}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
