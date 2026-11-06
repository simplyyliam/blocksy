// The tab rules of the project editor: pinned tabs stay first and survive "Close others",
// closing hands focus to the left neighbour, restored tabs are tidied. Pure store tests.
import { beforeEach, describe, expect, it } from "vitest"
import { HISTORY, OVERVIEW, isView, useEditor } from "./editor"

const editor = () => useEditor.getState()

beforeEach(() => editor().resetTabs())

describe("tabs", () => {
  it("opens a tab when something is selected, once", () => {
    editor().select("a")
    editor().select("a")
    editor().select("b")
    expect(editor().tabs).toEqual([OVERVIEW, "a", "b"])
    expect(editor().selected).toBe("b")
  })

  it("holds 20 tabs and still closes the middle one cleanly", () => {
    for (let i = 0; i < 20; i++) editor().select(`e${i}`)
    expect(editor().tabs).toHaveLength(21)
    editor().select("e10")
    editor().closeTab("e10")
    expect(editor().tabs).not.toContain("e10")
    expect(editor().selected).toBe("e9") // the neighbour on the left takes over
  })

  it("never closes the last tab: Overview comes back", () => {
    editor().closeTab(OVERVIEW)
    expect(editor().tabs).toEqual([OVERVIEW])
    expect(editor().selected).toBe(OVERVIEW)
  })

  it("moves pinned tabs to the front, in the order they were pinned", () => {
    for (const id of ["a", "b", "c"]) editor().select(id)
    editor().pin("c")
    editor().pin("a")
    expect(editor().tabs).toEqual(["c", "a", OVERVIEW, "b"])
    expect(editor().pinned).toEqual(["c", "a"])
  })

  it("unpinning puts the tab right after the pinned group", () => {
    for (const id of ["a", "b"]) editor().select(id)
    editor().pin("a")
    editor().pin("b")
    editor().unpin("a")
    expect(editor().tabs).toEqual(["b", "a", OVERVIEW])
    expect(editor().pinned).toEqual(["b"])
  })

  it("Close others keeps the chosen tab and every pinned tab", () => {
    for (const id of ["a", "b", "c"]) editor().select(id)
    editor().pin("a")
    editor().closeOthers("c")
    expect(editor().tabs).toEqual(["a", "c"])
    expect(editor().selected).toBe("c")
  })

  it("pruning drops tabs of deleted elements but keeps views", () => {
    for (const id of ["a", "b"]) editor().select(id)
    editor().select(HISTORY)
    editor().pin("a")
    editor().pruneTabs(new Set(["b"]))
    expect(editor().tabs).toEqual([OVERVIEW, "b", HISTORY])
    expect(editor().pinned).toEqual([])
  })

  it("restores remembered tabs: pinned first, duplicates gone, a missing selection falls back", () => {
    editor().restoreTabs(["a", "b", "a", "c"], ["c"], "zzz")
    expect(editor().tabs).toEqual(["c", "a", "b"])
    expect(editor().pinned).toEqual(["c"])
    expect(editor().selected).toBe("c")
  })

  it("tells views from elements", () => {
    expect(isView(OVERVIEW)).toBe(true)
    expect(isView("ruby_block")).toBe(false)
  })
})
