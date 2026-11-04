// The Item element type, as registered in the element registry.
// It has no loader templates of its own: each loader target brings an adapter
// for it (Fabric: packages/targets/fabric/src/elements/item.ts), see ADR 0006.
import type { ElementType } from "@blocksy/core"
import { itemDocs } from "./docs.ts"
import { itemDefaults, itemSchema, type ItemData } from "./schema.ts"

export const itemElement: ElementType<ItemData> = {
  id: "item",
  name: "Item",
  plural: "Items",
  schema: itemSchema,
  defaults: itemDefaults,
  templates: {},
  docs: itemDocs,
  // The name, plus one key per tooltip line (Minecraft's own key naming).
  lang: (item, project) => ({
    [`item.${project.modId}.${item.id}`]: item.name,
    ...Object.fromEntries(item.data.tooltip.map((line, i) => [`item.${project.modId}.${item.id}.tooltip.${i}`, line])),
  }),
}
