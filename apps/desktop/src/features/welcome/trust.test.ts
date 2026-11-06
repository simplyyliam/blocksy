import { describe, expect, it } from "vitest"
import { isTrustedIn, withTrusted } from "./trust"

describe("trusted projects", () => {
  const dirs = [String.raw`C:\Users\matth\Blocksy\berry_mod`]

  it("knows a folder it trusted, whatever the slashes or capitals", () => {
    expect(isTrustedIn(dirs, String.raw`C:\Users\matth\Blocksy\berry_mod`)).toBe(true)
    expect(isTrustedIn(dirs, "c:/users/MATTH/blocksy/berry_mod")).toBe(true)
  })

  it("does not trust a different or longer folder", () => {
    expect(isTrustedIn(dirs, String.raw`C:\Users\matth\Blocksy\berry_mod2`)).toBe(false)
    expect(isTrustedIn(dirs, String.raw`C:\Users\matth\Blocksy`)).toBe(false)
  })

  it("adds a folder once", () => {
    expect(withTrusted(dirs, "D:/mods/new")).toHaveLength(2)
    expect(withTrusted(dirs, "c:/users/matth/blocksy/berry_mod")).toBe(dirs)
  })
})
