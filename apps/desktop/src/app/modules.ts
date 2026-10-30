// The one place every module is registered (plan section 2.1).
// Adding a module = adding its package and one line below. Nothing else changes.
import type { ComponentType } from "react"
import type { LucideIcon } from "lucide-react"
import { createRegistries, type ElementEditorProps, type ElementType, type Project } from "@blocksy/core"
import { blockModule } from "@blocksy/element-block"
import { creativeTabModule } from "@blocksy/element-creative-tab"
import { fabricTarget } from "@blocksy/target-fabric"
import { minecraftTheme, modernTheme } from "@blocksy/ui"

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
registerElement(creativeTabModule)
registerElement(blockModule)

/** Loaders shown greyed out in New project until their target module exists. */
export const upcomingLoaders = [{ id: "neoforge", name: "NeoForge", note: "NeoForge support arrives after 1.0" }]
