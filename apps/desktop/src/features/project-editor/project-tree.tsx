// The project tree: the quiet left column of the project editor.
//   Overview
//   BLOCKS            +
//     ▣ First Block
//   CREATIVE TABS     +
//     ▦ First Block
// Groups come from the element registry (its `plural` names), so a new element type
// shows up here with no change to this file. Right-click a row to delete it (Ctrl+Z undoes).
import { LayoutDashboard, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { addElement, deriveElementId, removeElement, type Element } from "@blocksy/core"
import {
  Button, cn, ContextMenu, Input, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, Tooltip, TooltipContent, TooltipTrigger,
} from "@blocksy/ui"
import { elementModules, registries } from "../../app/modules"
import { useEditor } from "../../shared/stores/editor"
import { useProject } from "../../shared/stores/project"

/** A block's texture as a tiny icon, else the element type's icon. */
function ElementIcon({ element }: { element: Element }) {
  const texture = (element.data as { texture?: unknown } | null)?.texture
  if (typeof texture === "string") {
    return <img src={`data:image/png;base64,${texture}`} alt="" className="size-4 shrink-0 [image-rendering:pixelated]" />
  }
  const Icon = elementModules.get(element.type)?.Icon ?? LayoutDashboard
  return <Icon className="size-4 shrink-0 text-fg-muted" strokeWidth={1.75} />
}

const row = "h-7 w-full justify-start gap-2 px-2 font-normal"

export function ProjectTree() {
  const project = useProject((s) => s.current)
  const selected = useEditor((s) => s.selected)
  const select = useEditor((s) => s.select)
  // The group showing its "name your new element" field, if any.
  const [adding, setAdding] = useState<string | null>(null)
  if (!project) return null
  const { doc, documents } = project

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
    if (selected === element.id) select("overview")
  }

  return (
    <nav aria-label="Project" className="flex flex-col gap-4 py-1">
      <Button variant="ghost" size="sm" className={cn(row, selected === "overview" && "bg-surface-hover")} onClick={() => select("overview")}>
        <LayoutDashboard className="text-fg-muted" strokeWidth={1.75} /> Overview
      </Button>

      {registries.elementTypes.list().map((type) => {
        const items = doc.elements.filter((e) => e.type === type.id)
        return (
          <section key={type.id} className="flex flex-col gap-0.5">
            <div className="flex h-6 items-center justify-between pr-0.5 pl-2">
              <h3 className="text-xs font-medium tracking-[0.04em] text-fg-muted uppercase">{type.plural ?? type.name}</h3>
              <Tooltip>
                <TooltipTrigger
                  render={<Button variant="ghost" size="icon-xs" aria-label={`Add ${type.name.toLowerCase()}`} className="text-fg-muted" onClick={() => setAdding(type.id)} />}
                >
                  <Plus strokeWidth={2} />
                </TooltipTrigger>
                <TooltipContent>Add {type.name.toLowerCase()}</TooltipContent>
              </Tooltip>
            </div>
            {items.length === 0 && adding !== type.id && <p className="px-2 text-xs text-fg-faint">None yet</p>}
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
                  <ElementIcon element={element} />
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
                className="h-7 text-sm"
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
  )
}
