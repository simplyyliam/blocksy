import { describe, expect, it } from "vitest"
import { faceTexture } from "./cube-model.ts"

describe("cube model", () => {
  it("uses a face's own texture, then the cube's `all` texture", () => {
    const model = { textures: { all: "data:all", up: "data:top" } }
    expect(faceTexture(model, "up")).toBe("data:top")
    expect(faceTexture(model, "north")).toBe("data:all")
    expect(faceTexture({ textures: {} }, "down")).toBeNull()
  })
})
