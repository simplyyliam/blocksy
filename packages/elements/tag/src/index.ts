// @blocksy/element-tag: the Tag element (schema, canvas, inspector, Docs reference data, tests).
// Loader code lives in each target's adapter (ADR 0009).
// Public API of this package. Other packages may import only from here.
import { Hash } from "lucide-react"
import { TagCanvas, TagInspector } from "./editor.tsx"
import { tagElement } from "./element.ts"

export { tagElement } from "./element.ts"
export { RESERVED_BLOCK_TAGS, tagDefaults, tagFilePath, tagSchema, type TagData } from "./schema.ts"
export { TagCanvas, TagInspector }

/** Everything the app registers for tags, in one object (one registration line). */
export const tagModule = { type: tagElement, Inspector: TagInspector, Canvas: TagCanvas, Icon: Hash }
