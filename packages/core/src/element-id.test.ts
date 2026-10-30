import { describe, expect, it } from "vitest"
import { createDocumentStore } from "./commands.ts"
import { createProject, deriveElementId } from "./project.ts"
import { addElement, renameElement } from "./project-commands.ts"

describe("element ids and names", () => {
  it("derives a Minecraft-safe id that is unique in the project", () => {
    expect(deriveElementId("Ruby Block", [])).toBe("ruby_block")
    expect(deriveElementId("Ruby Block", ["ruby_block"])).toBe("ruby_block_2")
    expect(deriveElementId("Ruby Block", ["ruby_block", "ruby_block_2"])).toBe("ruby_block_3")
    expect(deriveElementId("  Ébène-Stone ", [])).toBe("ebene_stone")
    expect(deriveElementId("123", [])).toBe("element") // ids can't start with a digit
  })

  it("renames an element without changing its id, and undo brings the name back", () => {
    const store = createDocumentStore(createProject({ name: "Mod", target: "fabric", minecraftVersion: "26.1.2" }))
    store.execute(addElement({ id: "ruby_block", type: "block", name: "Ruby Block", data: {} }))
    store.execute(renameElement("ruby_block", "Shiny Ruby"))
    expect(store.get().elements[0]).toMatchObject({ id: "ruby_block", name: "Shiny Ruby" })
    store.undo()
    expect(store.get().elements[0]!.name).toBe("Ruby Block")
  })
})
