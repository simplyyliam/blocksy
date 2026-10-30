import { describe, expect, it } from "vitest"
import { createProject } from "@blocksy/core"
import { creativeTabElement, tabEntries } from "./element.ts"

describe("creative tab element", () => {
  it("has valid defaults", () => {
    expect(creativeTabElement.schema.parse(creativeTabElement.defaults())).toEqual({ icon: null })
  })

  it("lists the elements that picked this tab, in project order", () => {
    const project = {
      ...createProject({ name: "Mod", target: "fabric", minecraftVersion: "26.1.2" }),
      elements: [
        { id: "tab", type: "creative_tab", name: "My tab", data: { icon: null } },
        { id: "b", type: "block", name: "B", data: { tab: "tab" } },
        { id: "c", type: "block", name: "C", data: { tab: null } },
        { id: "a", type: "block", name: "A", data: { tab: "tab" } },
      ],
    }
    expect(tabEntries(project, "tab").map((e) => e.id)).toEqual(["b", "a"])
  })
})
