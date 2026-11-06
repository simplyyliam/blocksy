// The inventory view of block models: which faces the viewer sees and where they sit.
import { describe, expect, it } from "vitest"
import { poseProject, projectModel } from "./graphics.ts"
import type { ModelFace, Vec3 } from "./types.ts"

const POSE: Vec3 = [30, 225, 0]
const cube = (dir: ModelFace["dir"]): ModelFace => ({ dir, from: [0, 0, 0], to: [16, 16, 16], uv: [0, 0, 16, 16], uvRotation: 0, texture: "t", tinted: false })

describe("block pose", () => {
  it("shows the top, south and east faces of a block, like the game's inventory", () => {
    const facing = projectModel(["up", "north", "south", "east", "west"].map((d) => cube(d as ModelFace["dir"])), POSE)
      .filter((f) => f.facing)
      .map((f) => f.face.dir)
      .sort()
    expect(facing).toEqual(["east", "south", "up"])
  })

  it("puts the south face on the left and the east face on the right", () => {
    const [south, east] = ["south", "east"].map((d) => projectModel([cube(d as ModelFace["dir"])], POSE)[0]!)
    const centreX = (points: Vec3[]) => points.reduce((s, p) => s + p[0], 0) / points.length
    expect(centreX(south!.points)).toBeLessThan(0)
    expect(centreX(east!.points)).toBeGreaterThan(0)
  })

  it("keeps the top face above the side faces", () => {
    const y = (dir: ModelFace["dir"]) => projectModel([cube(dir)], POSE)[0]!.points.reduce((s, p) => s + p[1], 0) / 4
    expect(y("up")).toBeLessThan(y("south"))
  })

  it("draws far faces first, so the near ones cover them", () => {
    const stair: ModelFace[] = [
      { ...cube("up"), from: [0, 0, 0], to: [16, 8, 16] },
      { ...cube("up"), from: [8, 8, 0], to: [16, 16, 16] },
    ]
    const order = projectModel(stair, POSE).map((f) => f.depth)
    expect(order).toEqual([...order].sort((a, b) => a - b))
  })

  it("turns the model about its centre: the middle of the block stays in the middle", () => {
    const [x, y] = poseProject([8, 8, 8], POSE)
    expect(Math.abs(x)).toBeLessThan(1e-9)
    expect(Math.abs(y)).toBeLessThan(1e-9)
  })
})
