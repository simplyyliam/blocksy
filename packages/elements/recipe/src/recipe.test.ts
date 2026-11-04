import { describe, expect, it } from "vitest"
import { changeKind, recipeDefaults, recipeProblems, recipeSchema } from "./schema.ts"

describe("recipe element", () => {
  it("starts as an empty shaped grid that isn't ready yet", () => {
    const data = recipeDefaults()
    expect(recipeSchema.parse(data)).toEqual(data)
    expect(recipeProblems(data)).toEqual(["Pick what the recipe makes", "Put at least one ingredient in the grid"])
  })

  it("is ready once it has inputs and a result", () => {
    const shaped = { ...recipeDefaults(), grid: ["minecraft:wheat", ...Array(8).fill(null)], result: "berry_bun" }
    expect(recipeProblems(shaped)).toEqual([])
    const smelt = { ...recipeDefaults(), kind: "smelting" as const, ingredient: "berry_dough", result: "berry_bun" }
    expect(recipeProblems(smelt)).toEqual([])
  })

  it("keeps what fits when switching kinds", () => {
    const shaped = { ...recipeDefaults(), grid: [null, "minecraft:wheat", ...Array(7).fill(null)] }
    const smelt = changeKind(shaped, "smelting")
    expect(smelt.ingredient).toBe("minecraft:wheat")
    expect(smelt.cookingTime).toBe(200)
    expect(changeKind(smelt, "smoking").cookingTime).toBe(200) // cooking -> cooking keeps your time
    expect(changeKind({ ...smelt, grid: Array(9).fill(null) }, "shapeless").grid[0]).toBe("minecraft:wheat")
  })

  it("needs exactly nine slots", () => {
    expect(recipeSchema.safeParse({ ...recipeDefaults(), grid: [null] }).success).toBe(false)
  })
})
