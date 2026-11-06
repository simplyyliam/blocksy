import { describe, expect, it } from "vitest"
import { repoNameFromUrl, validateCloneUrl } from "./clone-url"

describe("clone address", () => {
  it("accepts plain https repository addresses", () => {
    expect(validateCloneUrl("https://github.com/you/berry-mod.git")).toBeNull()
    expect(validateCloneUrl("  https://github.com/you/berry-mod  ")).toBeNull()
  })
  it("refuses anything that isn't https", () => {
    expect(validateCloneUrl("http://github.com/you/berry-mod")).toMatch(/https/)
    expect(validateCloneUrl("git@github.com:you/berry-mod.git")).toMatch(/https/)
    expect(validateCloneUrl("ext::sh -c calc")).toMatch(/https/)
    expect(validateCloneUrl("file:///C:/secret")).toMatch(/https/)
  })
  it("refuses spaces and addresses without a repository", () => {
    expect(validateCloneUrl("https://github.com/you/ber ry")).toMatch(/spaces/)
    expect(validateCloneUrl("https://github.com/")).toMatch(/repository name/)
    expect(validateCloneUrl("https://localhost/you/x")).toMatch(/repository address/)
  })
  it("suggests a folder name from the address", () => {
    expect(repoNameFromUrl("https://github.com/you/berry-mod.git")).toBe("berry-mod")
    expect(repoNameFromUrl("https://github.com/you/berry-mod/")).toBe("berry-mod")
    expect(repoNameFromUrl("nonsense")).toBe("")
  })
})
