// The Language element's Docs reference page is generated from this data (plan 11.2).
import type { ElementDocs } from "@blocksy/core"

export const languageDocs: ElementDocs = {
  summary:
    "A Language holds your mod's text in one language. Blocksy lists every key your project makes (block and item names, " +
    "tab titles, tooltip lines) next to its English text, so translating is filling in a table. Minecraft shows the player's " +
    "language when it has a translation and English when it doesn't.",
  fields: [
    { key: "locale", label: "Language", description: "Minecraft's language code, like de_de for German. Players pick their language in Options.", java: "assets/<modid>/lang/de_de.json" },
    { key: "entries", label: "Translations", description: "Text per key. An empty cell isn't written, so that key stays English. A Language for en_us replaces Blocksy's English names.", java: '"item.<modid>.berry_bun": "Beerenbrötchen"' },
    { key: "custom", label: "Custom keys", description: "Keys the project doesn't make yet, for text your own code will show later." },
  ],
}
