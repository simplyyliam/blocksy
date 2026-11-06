// The item picker: choose an item or tag for a recipe slot or a tag's list.
// Custom arrangement of shadcn pieces (Popover + Input + Buttons). Why not shadcn's
// Combobox: its trigger is the text input (or a ComboboxTrigger that always adds a chevron
// and replaces the trigger's own children), so it can't be a crafting slot showing a
// texture. Keyboard works like a combobox: arrows move, Enter picks, Escape closes.
//
//   [ search items and tags ]
//   This mod     ▣ Berry Dough   ▣ First Block
//   Tags         # Fruits        # minecraft:planks
//   Minecraft    W Wheat         S Sweet berries ...
//   Use "c:foods/fruit"          <- any typed id works too
import { Hash } from "lucide-react"
import { useId, useMemo, useState, type ReactElement } from "react"
import type { Element, Project } from "@blocksy/core"
import { Button, cn, Input, McItemIcon, Popover, PopoverContent, PopoverTrigger } from "@blocksy/ui"
import { ITEM_ELEMENT_TYPES, isValidRef, parseRef, prettyId, refElement, refLabel, TAG_ELEMENT_TYPE, tagIdOf } from "./refs.ts"
import { VANILLA_BLOCK_TAGS, VANILLA_ITEM_TAGS, VANILLA_ITEMS } from "./vanilla.generated.ts"

/** A texture stored on an element (base64 PNG; animated ones are tall strips). */
export function elementTexture(element: Element | undefined): string | null {
  const texture = (element?.data as { texture?: unknown } | null | undefined)?.texture
  return typeof texture === "string" ? `data:image/png;base64,${texture}` : null
}

/** A soft, stable tint per id, so vanilla items (shown without Mojang's art) are easy to tell apart. */
function tint(id: string) {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return `oklch(0.86 0.06 ${h % 360})`
}

/** The small picture for a reference: the element's texture, a # for tags, else initials. */
export function RefTile({ refValue, project, className }: { refValue: string; project: Project; className?: string }) {
  const { kind, id } = parseRef(refValue)
  const texture = elementTexture(refElement(refValue, project))
  if (texture) return <img src={texture} alt="" className={cn("size-6 object-cover object-top [image-rendering:pixelated]", className)} />
  // What shows until Minecraft's files are loaded (no build yet): a # for tags, the initials otherwise.
  const label = prettyId(id)
  const placeholder =
    kind === "tag" || kind === "elementTag" ? (
      <Hash className={cn("size-4 text-fg-muted", className)} strokeWidth={2} />
    ) : (
      <span aria-hidden className={cn("grid size-6 place-items-center rounded-xs text-[10px] font-medium text-black/70", className)} style={{ background: tint(id) }}>
        {label.slice(0, 2)}
      </span>
    )
  // Vanilla items and tags: the game's own picture, read from the user's copy of Minecraft.
  if (kind === "item") return <McItemIcon item={{ vanilla: id }} className={className} fallback={placeholder} />
  if (kind === "tag") return <McItemIcon item={{ tag: id }} className={className} fallback={placeholder} />
  return placeholder
}

interface Option {
  ref: string
  label: string
  detail?: string
}

export interface ItemPickerProps {
  project: Project
  /** Called with the chosen reference ("minecraft:wheat", "#minecraft:planks", "berry_dough"). */
  onPick(ref: string): void
  /** Offer tags too (recipe ingredients, tag contents). Results never are tags. */
  allowTags?: boolean
  /** Which registry: items (default) or blocks (block tags). */
  registry?: "item" | "block"
  /** The button that opens the picker (a slot, a "+"). */
  trigger: ReactElement
}

const LIMIT = 60

export function ItemPicker({ project, onPick, allowTags = false, registry = "item", trigger }: ItemPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  // The highlighted option (arrow keys), as an index into all shown options.
  const [active, setActive] = useState(0)
  const listId = useId()

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const match = (o: Option) => !q || o.label.toLowerCase().includes(q) || o.ref.includes(q)
    const own: Option[] = project.elements
      .filter((e) => (registry === "block" ? e.type === "block" : ITEM_ELEMENT_TYPES.includes(e.type)))
      .map((e) => ({ ref: e.id, label: e.name, detail: `${project.modId}:${e.id}` }))
    const ownTags: Option[] = allowTags
      ? project.elements
          .filter((e) => e.type === TAG_ELEMENT_TYPE && ((e.data as { registry?: string }).registry ?? "item") === registry)
          .map((e) => ({ ref: `#${e.id}`, label: e.name, detail: `#${tagIdOf(e, project.modId)}` }))
      : []
    const vanillaTags: Option[] = allowTags
      ? (registry === "block" ? VANILLA_BLOCK_TAGS : VANILLA_ITEM_TAGS).map((t) => ({ ref: `#minecraft:${t}`, label: `#${t}`, detail: "Minecraft tag" }))
      : []
    const vanilla: Option[] = registry === "item" ? VANILLA_ITEMS.map((i) => ({ ref: `minecraft:${i}`, label: prettyId(i) })) : []
    return [
      { title: "This mod", options: own.filter(match) },
      { title: "Tags", options: [...ownTags, ...vanillaTags].filter(match).slice(0, LIMIT) },
      { title: "Minecraft", options: vanilla.filter(match).slice(0, LIMIT) },
    ].filter((g) => g.options.length > 0)
  }, [project, query, allowTags, registry])

  // Any typed id works too ("c:foods/fruit", "#c:ingots/copper"), for other mods' things.
  const typed = query.trim().toLowerCase()
  const canUseTyped = typed.includes(":") && isValidRef(typed) && (allowTags || !typed.startsWith("#"))

  const pick = (ref: string) => {
    onPick(ref)
    setOpen(false)
    setQuery("")
    setActive(0)
  }

  // Every shown option in order (the "Use <typed id>" row last), for arrow keys.
  const flat = [...groups.flatMap((g) => g.options.map((o) => o.ref)), ...(canUseTyped ? [typed] : [])]
  const activeRef = flat[Math.min(active, flat.length - 1)]
  const optionId = (ref: string) => `${listId}-${ref.replace(/[^a-z0-9]/gi, "_")}`
  const move = (by: number) => {
    if (flat.length === 0) return
    const next = (Math.min(active, flat.length - 1) + by + flat.length) % flat.length
    setActive(next)
    document.getElementById(optionId(flat[next]!))?.scrollIntoView({ block: "nearest" })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={trigger} />
      <PopoverContent className="w-72 gap-0 p-0" align="start">
        <div className="p-2">
          <Input
            autoFocus
            spellCheck={false}
            value={query}
            placeholder={allowTags ? "Search items and tags" : "Search items"}
            aria-label="Search"
            className="h-8"
            role="combobox"
            aria-expanded
            aria-controls={listId}
            aria-activedescendant={activeRef ? optionId(activeRef) : undefined}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault()
                move(e.key === "ArrowDown" ? 1 : -1)
              } else if (e.key === "Enter" && activeRef) {
                e.preventDefault()
                pick(activeRef)
              }
            }}
          />
        </div>
        <div id={listId} role="listbox" aria-label={allowTags ? "Items and tags" : "Items"} className="max-h-72 overflow-y-auto px-1 pb-1">
          {groups.map((g) => (
            <div key={g.title} className="pb-1">
              <p className="px-2 pt-1.5 pb-1 text-xs text-fg-faint">{g.title}</p>
              {g.options.map((o) => (
                <Button
                  key={o.ref}
                  id={optionId(o.ref)}
                  role="option"
                  aria-selected={o.ref === activeRef}
                  tabIndex={-1}
                  variant="ghost"
                  size="sm"
                  className={cn("w-full justify-start gap-2 px-2 font-normal", o.ref === activeRef && "bg-surface-hover")}
                  onMouseMove={() => setActive(flat.indexOf(o.ref))}
                  onClick={() => pick(o.ref)}
                >
                  <span className="grid size-6 shrink-0 place-items-center">
                    <RefTile refValue={o.ref} project={project} className="size-5" />
                  </span>
                  <span className="truncate">{o.label}</span>
                  {o.detail && <span className="ml-auto truncate pl-2 font-mono text-[10px] text-fg-faint">{o.detail}</span>}
                </Button>
              ))}
            </div>
          ))}
          {canUseTyped && (
            <Button
              id={optionId(typed)}
              role="option"
              aria-selected={typed === activeRef}
              tabIndex={-1}
              variant="ghost"
              size="sm"
              className={cn("w-full justify-start px-2 font-normal", typed === activeRef && "bg-surface-hover")}
              onClick={() => pick(typed)}
            >
              Use <code className="font-mono text-xs">{typed}</code>
            </Button>
          )}
          {groups.length === 0 && !canUseTyped && <p className="px-2 py-3 text-center text-xs text-fg-muted">Nothing found. Type a full id like c:foods/fruit.</p>}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { refLabel }
