// The small square picture for an element, used by the tree, the tabs and the palette.
// It shows the user's real texture: a block's or item's own, a recipe's result, a creative
// tab's icon item. Only when there is none does it show the element type's icon.
// (Vanilla things get their real art later in this release, from the asset reader.)
import { LayoutDashboard } from "lucide-react"
import type { Element, Project } from "@blocksy/core"
import { cn } from "@blocksy/ui"
import { elementTexture, refElement } from "@blocksy/game-data"
import { elementModules } from "../../app/modules"

/** The element's own texture, or the texture of the item it points at (recipe result, tab icon). */
function iconTexture(element: Element, project: Project): string | null {
  const own = elementTexture(element)
  if (own) return own
  const data = element.data as { result?: string | null; icon?: string | null } | null
  const pointer = element.type === "recipe" ? data?.result : element.type === "creative_tab" ? data?.icon : null
  return pointer ? elementTexture(refElement(pointer, project)) : null
}

/** `size` is the tile in px-classes; the image inside is always crisp (pixelated). */
export function ElementIcon({ element, project, className }: { element?: Element; project?: Project; className?: string }) {
  const texture = element && project ? iconTexture(element, project) : null
  const Icon = element ? (elementModules.get(element.type)?.Icon ?? LayoutDashboard) : LayoutDashboard
  return (
    <span className={cn("grid size-5 shrink-0 place-items-center rounded-[5px] bg-surface text-fg-muted", className)}>
      {texture ? (
        <img src={texture} alt="" className="size-3.5 object-cover object-top [image-rendering:pixelated]" />
      ) : (
        <Icon className="size-3" strokeWidth={1.75} />
      )}
    </span>
  )
}
