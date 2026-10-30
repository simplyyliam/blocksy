// Slow test: the v0.2 "First block" proof without a game window. Generates a mod with a
// creative tab and a block for every pinned Fabric version, then runs the same Gradle
// tasks Blocksy runs (runDatagen, then build) and checks what data generation wrote:
// the block model, its item model, a loot table that drops the block, and the tool tags.
// Run with: pnpm test:gradle   (needs a JDK and internet; first run takes minutes)
import { execFileSync } from "node:child_process"
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { describe, expect, it } from "vitest"
import { addElement, createDocumentStore, createProject, createRegistries } from "@blocksy/core"
import { blockDefaults, blockElement } from "@blocksy/element-block"
import { creativeTabElement } from "@blocksy/element-creative-tab"
import { FABRIC_VERSIONS, fabricTarget } from "@blocksy/target-fabric"
import { generate } from "./index.ts"

const registries = createRegistries()
registries.loaderTargets.register(fabricTarget)
registries.elementTypes.register(blockElement)
registries.elementTypes.register(creativeTabElement)

describe.each(FABRIC_VERSIONS)("Fabric $minecraft with a block", ({ minecraft }) => {
  it("generates data and builds a jar", () => {
    const store = createDocumentStore(createProject({ name: "Block Check", target: "fabric", minecraftVersion: minecraft }))
    store.execute(addElement({ id: "check_tab", type: "creative_tab", name: "Block Check", data: { icon: null } }))
    store.execute(addElement({ id: "check_block", type: "block", name: "Check Block", data: { ...blockDefaults(), toolTier: "stone", light: 7, tab: "check_tab" } }))
    const project = store.get()
    const dir = mkdtempSync(join(tmpdir(), `blocksy-block-${minecraft}-`))
    for (const file of generate(project, registries)) {
      const path = join(dir, file.path)
      mkdirSync(dirname(path), { recursive: true })
      writeFileSync(path, "contents" in file ? file.contents : Buffer.from(file.base64, "base64"))
      if (file.executable) chmodSync(path, 0o755)
    }

    // Like the app: the prepare tasks run as their own Gradle run first (Gradle can't order
    // runDatagen before build inside one run, since build packs what datagen writes).
    const windows = process.platform === "win32"
    const gradle = (tasks: string[]) =>
      execFileSync(windows ? "cmd.exe" : "./gradlew", windows ? ["/c", join(dir, "gradlew.bat"), ...tasks] : tasks, { cwd: dir, stdio: "inherit" })
    gradle(fabricTarget.prepareTasks?.(project) ?? [])
    gradle(["build"])

    const generated = (path: string) => JSON.parse(readFileSync(join(dir, "src/main/generated", path), "utf8"))
    // Looks right: a cube model using our texture, and an item model for the hand.
    expect(generated("assets/block_check/models/block/check_block.json").textures.all).toBe("block_check:block/check_block")
    expect(existsSync(join(dir, "src/main/generated/assets/block_check/blockstates/check_block.json"))).toBe(true)
    expect(existsSync(join(dir, "src/main/generated/assets/block_check/items/check_block.json"))).toBe(true)
    // Drops itself: the loot table's only entry is the block's own item.
    const loot = generated("data/block_check/loot_table/blocks/check_block.json")
    expect(loot.pools[0].entries[0].name).toBe("block_check:check_block")
    // Right tool: a pickaxe mines it, stone tier or better makes it drop.
    expect(generated("data/minecraft/tags/block/mineable/pickaxe.json").values).toContain("block_check:check_block")
    expect(generated("data/minecraft/tags/block/needs_stone_tool.json").values).toContain("block_check:check_block")
    expect(existsSync(join(dir, "build/libs/block_check-1.0.0.jar"))).toBe(true)
  })
})
