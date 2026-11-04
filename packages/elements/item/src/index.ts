// @blocksy/element-item: the Item element (schema, defaults, editor panel, texture canvas,
// Docs reference data, starter art and tests). Loader code lives in each target's adapter.
// Public API of this package. Other packages may import only from here.
import { Apple } from "lucide-react"
import type { Project } from "@blocksy/core"
import { ItemCanvas } from "./canvas.tsx"
import { itemElement } from "./element.ts"
import { ItemInspector } from "./inspector.tsx"
import { itemDefaults } from "./schema.ts"

export { itemElement } from "./element.ts"
export { foodDefaults, itemDefaults, itemSchema, TEXTURE_SIZE, type EffectData, type FoodData, type ItemData } from "./schema.ts"
export { EFFECTS, RARITIES, TICKS_PER_SMELT } from "./options.ts"
export { berryBunTexture, berryDoughTexture } from "./starter-art.ts"
export { ItemCanvas, ItemInspector }

/** Everything the app registers for items, in one object (one registration line). */
export const itemModule = {
  type: itemElement,
  Inspector: ItemInspector,
  Canvas: ItemCanvas,
  Icon: Apple,
  /** A new item joins the project's first creative tab, so it shows up in game right away. */
  create: (project: Project) => ({ ...itemDefaults(), tab: project.elements.find((e) => e.type === "creative_tab")?.id ?? null }),
}
