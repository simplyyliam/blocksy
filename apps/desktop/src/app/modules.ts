// The one place every module is registered (plan section 2.1).
// Adding a module = adding its package and one line below. Nothing else changes.
import type { ComponentType } from "react"
import { Eye, Paintbrush, Shapes, type LucideIcon } from "lucide-react"
import { createRegistries, type ElementEditorProps, type ElementType, type Project } from "@blocksy/core"
import { blockModule } from "@blocksy/element-block"
import { creativeTabModule } from "@blocksy/element-creative-tab"
import { itemModule } from "@blocksy/element-item"
import { languageModule } from "@blocksy/element-language"
import { recipeModule } from "@blocksy/element-recipe"
import { tagModule } from "@blocksy/element-tag"
import { fabricTarget } from "@blocksy/target-fabric"
import { minecraftTheme, modernTheme, type InspectorTab } from "@blocksy/ui"

export const registries = createRegistries()

/** An element package's UI parts, next to its registered element type. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ElementModule<Data = any> {
  type: ElementType<Data>
  /** The floating inspector on the right of the project editor. */
  Inspector: ComponentType<ElementEditorProps<Data>>
  /** What fills the editor when the element is selected (3D preview, tab sketch, ...). */
  Canvas: ComponentType<ElementEditorProps<Data>>
  Icon: LucideIcon
  /** Working modes shown in the mode bar (first = default). Elements without modes show none. */
  modes?: { id: string; label: string; Icon: LucideIcon }[]
  /** Tabs of the inspector (sections pick one with `tab`). Default: just Properties. A Code tab is always added. */
  inspectorTabs?: InspectorTab[]
  /** Data for a new element; defaults() when missing. */
  create?(project: Project): Data
}

/** Element UI by element type id, for the project editor. */
export const elementModules = new Map<string, ElementModule>()

function registerElement(module: ElementModule) {
  registries.elementTypes.register(module.type)
  elementModules.set(module.type.id, module)
}

registries.loaderTargets.register(fabricTarget)
registries.themes.register(modernTheme)
registries.themes.register(minecraftTheme)
const MODE_PAINT = { id: "paint", label: "Paint", Icon: Paintbrush }
const MODE_LOOK = { id: "look", label: "Look", Icon: Eye }

registerElement(creativeTabModule)
registerElement({
  ...blockModule,
  modes: [MODE_PAINT, { id: "model", label: "Model", Icon: Shapes }, MODE_LOOK],
  inspectorTabs: [{ id: "properties", label: "Properties" }, { id: "texture", label: "Texture" }, { id: "behaviour", label: "Behaviour" }],
})
registerElement({ ...itemModule, modes: [MODE_PAINT, MODE_LOOK], inspectorTabs: [{ id: "properties", label: "Properties" }, { id: "behaviour", label: "Behaviour" }] })
registerElement(recipeModule)
registerElement(tagModule)
registerElement(languageModule)

/** Loaders shown greyed out in New project until their target module exists. */
export const upcomingLoaders = [{ id: "neoforge", name: "NeoForge", note: "NeoForge support arrives after 1.0" }]
