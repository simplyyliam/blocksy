import { describe, expect, it } from "vitest"
import { minecraftTheme } from "./minecraft.ts"
import { modernTheme } from "./modern.ts"

describe("themes", () => {
  it("set exactly the same tokens, so every component works in both", () => {
    expect(Object.keys(minecraftTheme.tokens).sort()).toEqual(Object.keys(modernTheme.tokens).sort())
  })

  it("never use Mojang art: Minecraft theme textures are Blocksy's generated PNGs", () => {
    for (const key of ["texture-app", "texture-panel", "texture-edge"]) {
      expect(minecraftTheme.tokens[key]).toMatch(/^url\("data:image\/png;base64,/)
    }
  })
})
