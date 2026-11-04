// The Tag's Docs reference page is generated from this data (plan 11.2).
import type { ElementDocs } from "@blocksy/core"

export const tagDocs: ElementDocs = {
  summary:
    "A tag is a named group of items or blocks. Recipes can ask for a tag instead of one item: #minecraft:planks accepts " +
    "every plank. Make a new tag for your mod, or add your things to an existing one, like Minecraft's or the shared c: tags " +
    "other mods read.",
  fields: [
    { key: "registry", label: "Holds", description: "Items or blocks. Item tags work in recipes; block tags change how blocks behave (for example which tool mines them).", java: "data/<namespace>/tags/item/<path>.json" },
    { key: "target", label: "Adds to", description: "Empty makes a new tag named after this element (#<modid>:<id>). Pick an existing tag to add your entries to it instead; Minecraft merges the lists.", java: '#minecraft:planks' },
    { key: "values", label: "Entries", description: "The items or blocks in the tag. An entry can be another tag (#minecraft:flowers), which adds everything in it.", java: '{ "values": ["minecraft:apple", "#minecraft:flowers"] }' },
  ],
}
