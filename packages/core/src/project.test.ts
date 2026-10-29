import { describe, expect, it } from "vitest"
import { CURRENT_FORMAT_VERSION, createProject, deriveClassName, deriveModId } from "./project.ts"

describe("project", () => {
  it("derives a mod id and Java class name from the mod name", () => {
    expect(deriveModId("Aetheric Storage Engineering")).toBe("aetheric_storage_engineering")
    expect(deriveModId("  Café-Blocks 2 ")).toBe("cafe_blocks_2")
    expect(deriveModId("42")).toBe("my_first_mod") // can't start with a digit
    expect(deriveClassName("Aetheric Storage Engineering")).toBe("AethericStorageEngineering")
    expect(deriveClassName("2 fast")).toBe("Mod2Fast")
  })

  it("creates a valid empty project at the current format version", () => {
    const project = createProject({ name: "My Mod", target: "fabric", minecraftVersion: "26.1.2" })
    expect(project).toMatchObject({
      formatVersion: CURRENT_FORMAT_VERSION,
      modId: "my_mod",
      group: "com.example",
      elements: [],
    })
  })

  it("rejects an invalid mod id", () => {
    expect(() =>
      createProject({ name: "X", target: "fabric", minecraftVersion: "26.1.2", modId: "Bad Id" }),
    ).toThrow(/lowercase/)
  })
})
