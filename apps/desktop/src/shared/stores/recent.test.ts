import { describe, expect, it } from "vitest"
import { forgotten, MAX_UNPINNED, normalize, pinned, relocated, remembered, trim, type RecentProject } from "./recent"

const make = (dir: string, openedAt: number, extra: Partial<RecentProject> = {}): RecentProject => ({
  dir, name: dir, minecraftVersion: "26.1.2", target: "fabric", openedAt, ...extra,
})

describe("recent projects", () => {
  it("fills in the loader for entries saved before it existed", () => {
    expect(normalize({ dir: "a", name: "A", minecraftVersion: "26.1.2", openedAt: 1 }).target).toBe("fabric")
  })

  it("moves an opened project to the front and keeps its pin", () => {
    const list = [make("a", 1, { pinned: true }), make("b", 2)]
    const next = remembered(list, { dir: "A", name: "A", minecraftVersion: "26.1.2", target: "fabric" }, 10)
    expect(next[0]).toMatchObject({ name: "A", openedAt: 10, pinned: true })
    expect(next).toHaveLength(2)
  })

  it("treats Windows paths as the same folder whatever the slashes or case", () => {
    const list = [make(String.raw`C:\Mods\Berry`, 1)]
    expect(remembered(list, { dir: "c:/mods/berry", name: "x", minecraftVersion: "26.1.2", target: "fabric" }, 5)).toHaveLength(1)
    expect(forgotten(list, "c:/mods/BERRY")).toHaveLength(0)
  })

  it("drops the oldest unpinned projects but never a pinned one", () => {
    const many = Array.from({ length: MAX_UNPINNED + 5 }, (_, i) => make(`p${i}`, i + 100))
    const list = trim([make("old-pinned", 1, { pinned: true }), ...many])
    expect(list).toHaveLength(MAX_UNPINNED + 1)
    expect(list.some((p) => p.dir === "old-pinned")).toBe(true)
    expect(list.some((p) => p.dir === "p0")).toBe(false)
  })

  it("pins and unpins", () => {
    const list = pinned([make("a", 1)], "a", true)
    expect(list[0]!.pinned).toBe(true)
    expect(pinned(list, "a", false)[0]!.pinned).toBeUndefined()
  })

  it("relocates a moved project and drops a duplicate at the new place", () => {
    const list = [make("old", 3, { pinned: true }), make("new", 2), make("other", 1)]
    const next = relocated(list, "old", "new")
    expect(next.map((p) => p.dir)).toEqual(["new", "other"])
    expect(next[0]!.pinned).toBe(true)
    expect(relocated(list, "missing", "x")).toBe(list)
  })
})
