// Golden files for a mod with blocks and a creative tab: the v0.2 "First block" output.
// Open __golden__/first-block/ to see exactly what Blocksy writes for blocks.
// After an intended template change, update them with: pnpm test -u
import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import { addElement, createDocumentStore, createProject, createRegistries, type Project } from "@blocksy/core"
import { blockElement, blockDefaults } from "@blocksy/element-block"
import { creativeTabElement } from "@blocksy/element-creative-tab"
import { fabricTarget } from "@blocksy/target-fabric"
import { generate } from "./index.ts"

function setup() {
  const registries = createRegistries()
  registries.loaderTargets.register(fabricTarget)
  registries.elementTypes.register(blockElement)
  registries.elementTypes.register(creativeTabElement)
  return registries
}

/** A tab with two blocks (a stone-like one and a glowing iron-tier one), plus a block in no tab. */
function firstBlockMod(): Project {
  const store = createDocumentStore(createProject({ name: "First Block", target: "fabric", minecraftVersion: "26.1.2" }))
  store.execute(addElement({ id: "first_block_tab", type: "creative_tab", name: "First Block", data: { icon: "glow_block" } }))
  store.execute(addElement({ id: "first_block", type: "block", name: "First Block", data: { ...blockDefaults(), tab: "first_block_tab" } }))
  store.execute(
    addElement({
      id: "glow_block",
      type: "block",
      name: "Glow Block",
      data: { ...blockDefaults(), hardness: 5, resistance: 6, toolTier: "iron", light: 15, sound: "glass", mapColor: "gold", tab: "first_block_tab" },
    }),
  )
  store.execute(
    addElement({ id: "soft_block", type: "block", name: "Soft Block", data: { ...blockDefaults(), tool: "none", requiresTool: false, hardness: 0.5, resistance: 0.5, texture: null, sound: "wool", mapColor: "color_pink", tab: null } }),
  )
  return store.get()
}

describe("first block mod", () => {
  it("matches the golden files", async () => {
    for (const file of generate(firstBlockMod(), setup())) {
      if ("contents" in file) {
        await expect(file.contents).toMatchFileSnapshot(`./__golden__/first-block/${file.path}`)
      } else {
        const hash = createHash("sha256").update(Buffer.from(file.base64, "base64")).digest("hex")
        await expect(`${hash}\n`).toMatchFileSnapshot(`./__golden__/first-block/${file.path}.sha256`)
      }
    }
  })

  it("asks Fabric to run data generation before building", () => {
    expect(fabricTarget.prepareTasks?.(firstBlockMod())).toEqual(["runDatagen"])
    expect(fabricTarget.prepareTasks?.(createProject({ name: "Empty", target: "fabric", minecraftVersion: "26.1.2" }))).toEqual([])
  })

  it("gives every creative tab its own Java field, even tabs named x and x_key", () => {
    const store = createDocumentStore(createProject({ name: "Gems", target: "fabric", minecraftVersion: "26.1.2" }))
    store.execute(addElement({ id: "gems", type: "creative_tab", name: "Gems", data: { icon: null } }))
    store.execute(addElement({ id: "gems_key", type: "creative_tab", name: "Gems Key", data: { icon: null } }))
    const java = generate(store.get(), setup()).find((f) => f.path.endsWith("ModCreativeTabs.java"))!
    const fields = [...("contents" in java ? java.contents : "").matchAll(/public static final \w+ (\w+) =/g)].map((m) => m[1])
    expect(fields).toEqual(["GEMS", "GEMS_KEY"])
  })

  it("is pure", () => {
    expect(generate(firstBlockMod(), setup())).toEqual(generate(firstBlockMod(), setup()))
  })
})
