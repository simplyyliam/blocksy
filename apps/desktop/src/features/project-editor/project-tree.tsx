// The project tree: the left column of the project editor, flush on the white page,
// styled after docs/design/visual-editor(assets).jpg (icon tiles, Title-case groups).
//
//   ┌──────────────────────┐
//   │ Ruby Mod             │  <- project header
//   │ Fabric · 26.1.2      │
//   ├──────────────────────┤
//   │ [▦] Overview         │
//   │ Blocks             + │  <- groups come from the element registry (`plural`)
//   │ [▣] First Block      │
//   │ Creative tabs      + │
//   │ [▦] Ruby Mod         │
//   └──────────────────────┘
// A new element type shows up here with no change to this file. Right-click a row to
// delete it (Ctrl+Z undoes).
import { LayoutDashboard, Plus, Trash2 } from "lucide-react"
import { useState, type ReactNode } from "react"
import { addElement, deriveElementId, removeElement, type Element } from "@blocksy/core"
import {
  Button, cn, ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, Input, Tooltip, TooltipContent, TooltipTrigger,
} from "@blocksy/ui"
import { elementModules, registries } from "../../app/modules"
import { OVERVIEW, useEditor } from "../../shared/stores/editor"
import { useProject } from "../../shared/stores/project"

/** The small square tile every row starts with: a block's texture, else its type icon. */
function Tile({ element, children }: { element?: Element; children?: ReactNode }) {
  const texture = (element?.data as { texture?: unknown } | null | undefined)?.texture
  const Icon = element ? (elementModules.get(element.type)?.Icon ?? LayoutDashboard) : null
  return (
    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-surface text-fg-muted">
      {typeof texture === "string" ? (
        <img src={`data:image/png;base64,${texture}`} alt="" className="size-4 [image-rendering:pixelated]" />
      ) : Icon ? (
        <Icon className="size-4" strokeWidth={1.75} />
      ) : (
        children
      )}
    </span>
  )
}

const row = "h-9 w-full justify-start gap-2.5 rounded-xl px-1 font-normal"

export function ProjectTree() {
  const project = useProject((s) => s.current)
  const selected = useEditor((s) => s.selected)
  const select = useEditor((s) => s.select)
  // The group showing its "name your new element" field, if any.
  const [adding, setAdding] = useState<string | null>(null)
  if (!project) return null
  const { doc, documents, version, targetName } = project

  /** Creates the element from the typed name; its id (ruby_block) comes from this first name. */
  const add = (typeId: string, typed: string) => {
    setAdding(null)
    const name = typed.trim()
    if (!name) return
    const module = elementModules.get(typeId)!
    const id = deriveElementId(name, doc.elements.map((e) => e.id))
    const data = module.create ? module.create(doc) : module.type.defaults()
    documents.execute(addElement({ id, type: typeId, name, data }))
    select(id)
  }

  const remove = (element: Element) => {
    documents.execute(removeElement(element.id))
    if (selected === element.id) select(OVERVIEW)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Project header, like "Robot 2.0 / 3D Design Project" in the reference. */}
      <div className="flex items-start justify-between gap-2 px-3 pt-2 pb-3">
        <div className="min-w-0">
          <p className="truncate text-md font-medium text-fg">{doc.name}</p>
          <p className="mt-0.5 truncate text-xs text-fg-muted">
            {targetName} · Minecraft {version.minecraft}
          </p>
        </div>
      </div>

      <nav aria-label="Project" className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto border-t border-line-subtle px-2 pt-3 pb-4">
        <Button variant="ghost" size="sm" className={cn(row, selected === OVERVIEW && "bg-surface-hover")} onClick={() => select(OVERVIEW)}>
          <Tile>
            <LayoutDashboard className="size-4" strokeWidth={1.75} />
          </Tile>
          Overview
        </Button>

        {registries.elementTypes.list().map((type) => {
          const items = doc.elements.filter((e) => e.type === type.id)
          return (
            <section key={type.id} className="flex flex-col gap-0.5">
              <div className="flex h-7 items-center justify-between pr-0.5 pl-1">
                <h3 className="text-sm font-medium text-fg">{type.plural ?? type.name}</h3>
                <Tooltip>
                  <TooltipTrigger
                    render={<Button variant="ghost" size="icon-xs" aria-label={`Add ${type.name.toLowerCase()}`} className="text-fg-muted" onClick={() => setAdding(type.id)} />}
                  >
                    <Plus strokeWidth={2} />
                  </TooltipTrigger>
                  <TooltipContent>Add {type.name.toLowerCase()}</TooltipContent>
                </Tooltip>
              </div>
              {items.length === 0 && adding !== type.id && <p className="px-1 pb-1 text-xs text-fg-faint">None yet</p>}
              {items.map((element) => (
                <ContextMenu key={element.id}>
                  <ContextMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-current={selected === element.id ? "true" : undefined}
                        className={cn(row, selected === element.id && "bg-surface-hover")}
                        onClick={() => select(element.id)}
                      />
                    }
                  >
                    <Tile element={element} />
                    <span className="truncate">{element.name}</span>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-44">
                    <ContextMenuItem variant="destructive" onClick={() => remove(element)}>
                      <Trash2 strokeWidth={1.75} /> Delete {type.name.toLowerCase()}
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
              {adding === type.id && (
                <Input
                  autoFocus
                  spellCheck={false}
                  aria-label={`Name of the new ${type.name.toLowerCase()}`}
                  placeholder={`Name, e.g. Ruby ${type.name}`}
                  className="h-8 text-sm"
                  onBlur={(e) => add(type.id, e.target.value)}
                  onKeyDown={(e) => {
                    // Both end in blur, which creates the element once (or cancels when empty).
                    if (e.key === "Escape") e.currentTarget.value = ""
                    if (e.key === "Enter" || e.key === "Escape") e.currentTarget.blur()
                  }}
                />
              )}
            </section>
          )
        })}
      </nav>
    </div>
  )
}
