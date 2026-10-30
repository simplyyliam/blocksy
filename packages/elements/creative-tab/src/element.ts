// The Creative tab element: a tab in the creative inventory for your mod's things.
// Its name is the tab's title; blocks pick their tab in their own inspector.
// Loader code lives in each target's adapter (Fabric: src/elements/creative-tab.ts).
import type { ElementDocs, ElementType, Project } from "@blocksy/core"
import { z } from "zod"

export const creativeTabSchema = z.object({
  /** Element id of the block shown on the tab, or null for the first block in it. */
  icon: z.string().nullable(),
})

export type CreativeTabData = z.infer<typeof creativeTabSchema>

export const creativeTabDocs: ElementDocs = {
  summary:
    "A creative tab is a page of the creative inventory. Give your mod one so players can find its blocks in one place. " +
    "Blocks join a tab from their own inspector (Creative tab → Shows in).",
  fields: [
    { key: "name", label: "Title", description: "The title shown when you hover the tab.", java: 'Component.translatable("itemGroup.<modid>.<id>")' },
    { key: "icon", label: "Icon", description: "The block drawn on the tab. Empty uses the first block in the tab.", java: ".icon(() -> new ItemStack(ModBlocks.FIRST_BLOCK))" },
    { key: "entries", label: "Contents", description: "Every block whose Creative tab is this one, in project order.", java: ".displayItems((params, output) -> output.accept(ModBlocks.FIRST_BLOCK))" },
  ],
}

export const creativeTabElement: ElementType<CreativeTabData> = {
  id: "creative_tab",
  name: "Creative tab",
  plural: "Creative tabs",
  schema: creativeTabSchema,
  defaults: () => ({ icon: null }),
  templates: {},
  docs: creativeTabDocs,
}

/** Elements that show in this tab: any element whose data has `tab` set to its id. */
export function tabEntries(project: Project, tabId: string) {
  return project.elements.filter((e) => (e.data as { tab?: unknown } | null)?.tab === tabId)
}
