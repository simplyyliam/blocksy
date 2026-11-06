import { describe, expect, it } from "vitest"
import { groupProblem, javaPackage, modIdFromName, modIdProblem, validateNewProject } from "./validate"

const ok = { name: "Berry Mod", modId: "berry_mod", group: "com.example", location: "C:/Blocksy", folderExists: false }

describe("new project validation", () => {
  it("accepts a normal form", () => {
    expect(validateNewProject(ok)).toEqual({})
  })

  it("asks for a name", () => {
    expect(validateNewProject({ ...ok, name: "  " }).name).toMatch(/name/)
  })

  it("makes the mod ID from the name, and nothing from an empty name", () => {
    expect(modIdFromName("Berry Mod")).toBe("berry_mod")
    expect(modIdFromName("  ")).toBe("")
  })

  it("explains each mod ID mistake in its own words", () => {
    expect(modIdProblem("")).toMatch(/ID/)
    expect(modIdProblem("a")).toMatch(/at least 2/)
    expect(modIdProblem("9lives")).toMatch(/start with a lowercase letter/)
    expect(modIdProblem("Berry Mod")).toMatch(/lowercase letters, digits/)
    expect(modIdProblem("a".repeat(65))).toMatch(/at most 64/)
    expect(modIdProblem("berry_mod")).toBeNull()
  })

  it("refuses ids the game or loader use, and Java words", () => {
    expect(modIdProblem("minecraft")).toMatch(/already used/)
    expect(modIdProblem("fabric")).toMatch(/already used/)
    expect(modIdProblem("class")).toMatch(/Java word/)
  })

  it("checks the Java package", () => {
    expect(groupProblem("com.example")).toBeNull()
    expect(groupProblem("")).toMatch(/Enter a Java package/)
    expect(groupProblem("Com.Example")).toMatch(/lowercase/)
    expect(groupProblem("com..example")).toMatch(/lowercase/)
    expect(groupProblem("com.new.mod")).toMatch(/"new" is a Java word/)
  })

  it("needs a location and refuses a folder that already exists", () => {
    expect(validateNewProject({ ...ok, location: "" }).location).toMatch(/Choose where/)
    expect(validateNewProject({ ...ok, folderExists: true }).location).toMatch(/already exists/)
    expect(validateNewProject({ ...ok, folderExists: null })).toEqual({})
  })

  it("shows the full package", () => {
    expect(javaPackage("com.example", "berry_mod")).toBe("com.example.berry_mod")
    expect(javaPackage("com.example", "")).toBe("com.example.mod_id")
  })
})
