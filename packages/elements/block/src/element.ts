// The Block element type, as registered in the element registry.
// It has no loader templates of its own: each loader target brings an adapter
// for it (Fabric: packages/targets/fabric/src/elements/block.ts), see ADR 0006.
import type { ElementType } from "@blocksy/core"
import { blockDocs } from "./docs.ts"
import { blockDefaults, blockSchema, type BlockData } from "./schema.ts"

export const blockElement: ElementType<BlockData> = {
  id: "block",
  name: "Block",
  plural: "Blocks",
  schema: blockSchema,
  defaults: blockDefaults,
  templates: {},
  docs: blockDocs,
}
