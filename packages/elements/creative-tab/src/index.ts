// @blocksy/element-creative-tab: the Creative tab element (schema, editor panel, canvas,
// Docs reference data, tests). Loader code lives in each target's adapter (ADR 0006).
// Public API of this package. Other packages may import only from here.
import { LayoutGrid } from "lucide-react"
import { CreativeTabCanvas, CreativeTabInspector } from "./editor.tsx"
import { creativeTabElement } from "./element.ts"

export { creativeTabElement, creativeTabSchema, tabEntries, type CreativeTabData } from "./element.ts"
export { CreativeTabCanvas, CreativeTabInspector }

/** Everything the app registers for creative tabs, in one object (one registration line). */
export const creativeTabModule = { type: creativeTabElement, Inspector: CreativeTabInspector, Canvas: CreativeTabCanvas, Icon: LayoutGrid }
