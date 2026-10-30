// Starters: what a new project begins with (the left column of New project).
// - Blank mod: nothing, just the empty mod.
// - Starter block (v0.2 "First block"): a creative tab with one block in it, wearing
//   Blocksy's own starter texture, so Run shows a real block in game straight away.
import { addElement, createDocumentStore, deriveElementId, type Project } from "@blocksy/core"
import { blockDefaults } from "@blocksy/element-block"
import { creativeTabElement } from "@blocksy/element-creative-tab"

export type StarterId = "empty" | "block"

export function applyStarter(project: Project, starter: StarterId): Project {
  if (starter === "empty") return project
  const store = createDocumentStore(project)
  const tabId = deriveElementId(`${project.name} tab`, [])
  store.execute(addElement({ id: tabId, type: creativeTabElement.id, name: project.name, data: { icon: "first_block" } }))
  store.execute(addElement({ id: "first_block", type: "block", name: "First Block", data: { ...blockDefaults(), tab: tabId } }))
  return store.get()
}
