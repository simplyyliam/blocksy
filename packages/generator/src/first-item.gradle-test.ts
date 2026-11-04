// Slow test: the v0.3 "First item" proof without a game window. Generates the first-item mod
// (items, food, fuel, compost, animated texture, every recipe kind, tags, languages) for every
// pinned Fabric version, runs the same Gradle tasks Blocksy runs (runDatagen, then build),
// and checks the jar holds what Minecraft needs: recipes, item models, textures, tags, lang.
// Run with: pnpm test:gradle   (needs a JDK and internet; first run takes minutes)
import { execFileSync } from "node:child_process"
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { describe, expect, it } from "vitest"
import { FABRIC_VERSIONS, fabricTarget } from "@blocksy/target-fabric"
import { generate } from "./index.ts"
import { firstItemMod, firstItemRegistries } from "./__fixtures__/first-item.ts"

describe.each(FABRIC_VERSIONS)("Fabric $minecraft with items and recipes", ({ minecraft }) => {
  it("generates data and builds a jar with everything in it", () => {
    const project = firstItemMod(minecraft)
    const dir = mkdtempSync(join(tmpdir(), `blocksy-item-${minecraft}-`))
    for (const file of generate(project, firstItemRegistries())) {
      const path = join(dir, file.path)
      mkdirSync(dirname(path), { recursive: true })
      writeFileSync(path, "contents" in file ? file.contents : Buffer.from(file.base64, "base64"))
      if (file.executable) chmodSync(path, 0o755)
    }

    const windows = process.platform === "win32"
    const gradle = (tasks: string[]) =>
      execFileSync(windows ? "cmd.exe" : "./gradlew", windows ? ["/c", join(dir, "gradlew.bat"), ...tasks] : tasks, { cwd: dir, stdio: "inherit" })
    gradle(fabricTarget.prepareTasks?.(project) ?? [])
    gradle(["build"])

    // Data generation wrote flat item models pointing at our textures.
    const model = JSON.parse(readFileSync(join(dir, "src/main/generated/assets/first_item/models/item/berry_bun.json"), "utf8"))
    expect(model.textures.layer0).toBe("first_item:item/berry_bun")
    expect(existsSync(join(dir, "src/main/generated/assets/first_item/items/berry_bun.json"))).toBe(true)

    // The jar holds recipes, tags, textures (with the animation file) and both languages.
    const jar = join(dir, "build/libs/first_item-1.0.0.jar")
    const entries = execFileSync("jar", ["tf", jar], { encoding: "utf8" }).split(/\r?\n/)
    for (const entry of [
      "data/first_item/recipe/berry_dough_recipe.json",
      "data/first_item/recipe/berry_bun_smelting.json",
      "data/first_item/recipe/berry_bun_smoking.json",
      "data/first_item/recipe/sky_gem_recipe.json",
      "data/first_item/recipe/sky_dust_cutting.json",
      "data/first_item/recipe/crate_blasting.json",
      "data/first_item/tags/item/fruits.json",
      "data/c/tags/item/foods/fruit.json",
      "assets/first_item/textures/item/berry_bun.png",
      "assets/first_item/textures/item/berry_bun.png.mcmeta",
      "assets/first_item/models/item/berry_bun.json",
      "assets/first_item/lang/en_us.json",
      "assets/first_item/lang/de_de.json",
      "com/example/first_item/item/ModItems.class",
    ]) {
      expect(entries, entry).toContain(entry)
    }
  })
})
