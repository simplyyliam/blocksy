// The one place every module is registered (plan section 2.1).
// Adding a module = adding its package and one line below. Nothing else changes.
import { createRegistries } from "@blocksy/core"
import { fabricTarget } from "@blocksy/target-fabric"
import { modernTheme } from "@blocksy/ui"

export const registries = createRegistries()

registries.loaderTargets.register(fabricTarget)
registries.themes.register(modernTheme)

/** Loaders shown greyed out in New project until their target module exists. */
export const upcomingLoaders = [{ id: "neoforge", name: "NeoForge", note: "NeoForge support arrives after 1.0" }]
