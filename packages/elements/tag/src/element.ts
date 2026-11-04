// The Tag element type, as registered in the element registry. Loader code (the tag JSON
// and where it goes) lives in each target's adapter (ADR 0009).
import type { ElementType } from "@blocksy/core"
import { tagDocs } from "./docs.ts"
import { tagDefaults, tagSchema, type TagData } from "./schema.ts"

export const tagElement: ElementType<TagData> = {
  id: "tag",
  name: "Tag",
  plural: "Tags",
  schema: tagSchema,
  defaults: tagDefaults,
  templates: {},
  docs: tagDocs,
}
