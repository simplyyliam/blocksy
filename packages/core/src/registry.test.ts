import { describe, expect, it } from "vitest"
import { createRegistry } from "./registry.ts"
import { createRegistries } from "./registries.ts"

describe("registry", () => {
  it("registers, looks up and lists modules in order", () => {
    const themes = createRegistry<{ id: string }>("theme")
    themes.register({ id: "modern" })
    themes.register({ id: "minecraft" })
    expect(themes.get("modern")).toEqual({ id: "modern" })
    expect(themes.list().map((t) => t.id)).toEqual(["modern", "minecraft"])
  })

  it("rejects duplicate ids and explains unknown ones", () => {
    const targets = createRegistry<{ id: string }>("loader target")
    targets.register({ id: "fabric" })
    expect(() => targets.register({ id: "fabric" })).toThrow(/already registered/)
    expect(() => targets.require("neoforge")).toThrow('Unknown loader target "neoforge"')
  })

  it("creates all eight registries from plan section 2.1", () => {
    expect(Object.keys(createRegistries())).toEqual([
      "elementTypes", "nodeTypes", "guiComponents", "modelFormats",
      "modelStudioTools", "loaderTargets", "themes", "docsDemos",
    ])
  })
})
