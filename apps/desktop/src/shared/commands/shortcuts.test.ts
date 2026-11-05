import { describe, expect, it } from "vitest"
import { isBareShortcut, matchesShortcut, shortcutParts, type KeyLike } from "./shortcuts"

const key = (k: string, extra: Partial<KeyLike> = {}): KeyLike => ({
  key: k,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  altKey: false,
  ...extra,
})

describe("shortcuts", () => {
  it("matches Mod with Ctrl or Cmd", () => {
    expect(matchesShortcut(key("s", { ctrlKey: true }), "Mod+S")).toBe(true)
    expect(matchesShortcut(key("s", { metaKey: true }), "Mod+S")).toBe(true)
    expect(matchesShortcut(key("s"), "Mod+S")).toBe(false)
  })

  it("keeps Shift apart for letters", () => {
    expect(matchesShortcut(key("Z", { ctrlKey: true, shiftKey: true }), "Mod+Shift+Z")).toBe(true)
    expect(matchesShortcut(key("z", { ctrlKey: true }), "Mod+Shift+Z")).toBe(false)
    expect(matchesShortcut(key("Z", { ctrlKey: true, shiftKey: true }), "Mod+Z")).toBe(false)
  })

  it("matches symbol keys that carry Shift themselves", () => {
    expect(matchesShortcut(key("?", { shiftKey: true }), "?")).toBe(true)
    expect(matchesShortcut(key("\\", { ctrlKey: true }), "Mod+\\")).toBe(true)
  })

  it("does not match extra modifiers", () => {
    expect(matchesShortcut(key("n", { altKey: true }), "N")).toBe(false)
    expect(matchesShortcut(key("n", { ctrlKey: true }), "N")).toBe(false)
  })

  it("shows readable parts and flags bare shortcuts", () => {
    expect(shortcutParts("Mod+Shift+Z")).toEqual(["Ctrl", "Shift", "Z"])
    expect(shortcutParts("Mod+K", true)).toEqual(["⌘", "K"])
    expect(isBareShortcut("N")).toBe(true)
    expect(isBareShortcut("Mod+N")).toBe(false)
  })
})
