import { describe, expect, it } from "vitest"
import { prettyPath } from "./paths"

const home = String.raw`C:\Users\matth`

describe("prettyPath", () => {
  it("shortens the home folder to ~", () => {
    expect(prettyPath(String.raw`C:\Users\matth\Blocksy\berry_mod`, home)).toBe("~/Blocksy/berry_mod")
  })
  it("also works when the path uses forward slashes or other capitals", () => {
    expect(prettyPath("C:/Users/matth/Blocksy/berry_mod", home)).toBe("~/Blocksy/berry_mod")
    expect(prettyPath(String.raw`c:\users\MATTH\x`, home)).toBe("~/x")
  })
  it("does not treat a longer sibling folder as inside home", () => {
    expect(prettyPath(String.raw`C:\Users\matth2\mod`, home)).toBe(String.raw`C:\Users\matth2\mod`)
  })
  it("leaves other paths alone", () => {
    expect(prettyPath(String.raw`D:\mods\old`, home)).toBe(String.raw`D:\mods\old`)
    expect(prettyPath("/tmp/x", null)).toBe("/tmp/x")
  })
})
