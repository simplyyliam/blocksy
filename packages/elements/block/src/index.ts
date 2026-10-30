// @blocksy/element-block: the Block element (schema, defaults, editor panel, canvas,
// Docs reference data and tests). Loader code lives in each target's adapter (ADR 0006).
// Public API of this package. Other packages may import only from here.
import { Box } from "lucide-react"
import { BlockCanvas } from "./canvas.tsx"
import { blockElement } from "./element.ts"
import { BlockInspector } from "./inspector.tsx"

export { blockElement } from "./element.ts"
export { blockDefaults, blockSchema, TEXTURE_SIZE, type BlockData } from "./schema.ts"
export { MAP_COLORS, SOUNDS, TOOL_TIERS, TOOLS } from "./options.ts"
export { encodePng, pngDataUrl, pngSize } from "./png.ts"
export { starterTexture, STARTER_PALETTE } from "./starter-texture.ts"
export { BlockCanvas, BlockInspector }

/** Everything the app registers for blocks, in one object (one registration line). */
export const blockModule = { type: blockElement, Inspector: BlockInspector, Canvas: BlockCanvas, Icon: Box }
