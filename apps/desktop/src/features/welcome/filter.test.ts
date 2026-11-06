import { describe, expect, it } from "vitest"
import type { RecentProject } from "../../shared/stores/recent"
import { ago, displayOrder, filterProjects, groupProjects, moveSelection } from "./filter"

const make = (name: string, dir: string, extra: Partial<RecentProject> = {}): RecentProject => ({
  name, dir, minecraftVersion: "26.1.2", target: "fabric", openedAt: 1, ...extra,
})
const list = [make("Berry Mod", "C:/Blocksy/berry_mod", { pinned: true }), make("Copper Golems", "C:/Blocksy/copper_golems"), make("Old Test", "D:/mods/old_test")]

describe("project search", () => {
  it("returns everything for an empty search", () => {
    expect(filterProjects(list, "  ")).toHaveLength(3)
  })
  it("matches name, folder (mod id) and path, in any case", () => {
    expect(filterProjects(list, "BERRY").map((p) => p.name)).toEqual(["Berry Mod"])
    expect(filterProjects(list, "copper_golems").map((p) => p.name)).toEqual(["Copper Golems"])
    expect(filterProjects(list, "d:/mods").map((p) => p.name)).toEqual(["Old Test"])
  })
  it("needs every word, in any order", () => {
    expect(filterProjects(list, "mod berry")).toHaveLength(1)
    expect(filterProjects(list, "berry golems")).toHaveLength(0)
  })
  it("matches the loader and Minecraft version", () => {
    expect(filterProjects(list, "fabric 26.1")).toHaveLength(3)
  })
})

describe("grouping", () => {
  it("puts pinned first and keeps the order inside each group", () => {
    const { pinned, recent } = groupProjects(list)
    expect(pinned.map((p) => p.name)).toEqual(["Berry Mod"])
    expect(recent.map((p) => p.name)).toEqual(["Copper Golems", "Old Test"])
    expect(displayOrder([list[1]!, list[0]!]).map((p) => p.name)).toEqual(["Berry Mod", "Copper Golems"])
  })
})

describe("ago", () => {
  const now = 1_000_000_000_000
  it("says it in plain words", () => {
    expect(ago(now - 10_000, now)).toBe("just now")
    expect(ago(now - 5 * 60_000, now)).toBe("5 min ago")
    expect(ago(now - 3 * 3_600_000, now)).toBe("3 h ago")
    expect(ago(now - 30 * 3_600_000, now)).toBe("yesterday")
    expect(ago(now - 5 * 86_400_000, now)).toBe("5 days ago")
    expect(ago(now - 21 * 86_400_000, now)).toBe("3 weeks ago")
    expect(ago(now - 90 * 86_400_000, now)).toBe("3 months ago")
  })
})

describe("keyboard selection", () => {
  it("clamps at both ends and jumps with Home and End", () => {
    expect(moveSelection(3, 0, "ArrowUp")).toBe(0)
    expect(moveSelection(3, 2, "ArrowDown")).toBe(2)
    expect(moveSelection(3, 1, "ArrowDown")).toBe(2)
    expect(moveSelection(3, 1, "Home")).toBe(0)
    expect(moveSelection(3, 1, "End")).toBe(2)
  })
  it("starts at the top or bottom when nothing is selected, and copes with an empty list", () => {
    expect(moveSelection(3, -1, "ArrowDown")).toBe(0)
    expect(moveSelection(3, -1, "ArrowUp")).toBe(2)
    expect(moveSelection(0, -1, "ArrowDown")).toBe(-1)
  })
})
