// Fabric adapter for the Recipe element (ADR 0009). One recipe becomes one JSON file:
//   data/<modid>/recipe/<id>.json
// Plain JSON, not data generation: the format is the same on every pinned Minecraft version
// (the recipe datagen API isn't), and it reads like Minecraft's own recipes.
//
//   shaped grid            pattern (trimmed)     key
//   [ .  W  . ]            [" W ",               { "W": "minecraft:wheat",
//   [ W  S  W ]      ->     "WSW"]                 "S": "minecraft:sweet_berries" }
//   [ .  .  . ]
import type { Element, GeneratedFile, GenerateContext } from "@blocksy/core"
import { atLeast } from "../versions.ts"
import { resolveRef } from "./refs.ts"

export interface RecipeData {
  kind: "shaped" | "shapeless" | "smelting" | "blasting" | "smoking" | "stonecutting"
  grid: (string | null)[]
  ingredient: string | null
  result: string | null
  count: number
  cookingTime: number
  experience: number
  category: "food" | "blocks" | "misc"
}

export type RecipeElement = Element & { data: RecipeData }

/** Shaped recipes: the smallest box around the filled slots, rows top to bottom. */
function trimmedRows(grid: (string | null)[]): (string | null)[][] {
  const rows = [0, 1, 2].map((r) => grid.slice(r * 3, r * 3 + 3))
  const used = (cells: (string | null)[]) => cells.some((c) => c !== null)
  const usedRows = rows.filter(used)
  const cols = [0, 1, 2].filter((c) => rows.some((row) => row[c] !== null))
  return usedRows.map((row) => row.slice(cols[0], cols.at(-1)! + 1))
}

/** A letter per different ingredient: its first letter if free, else the next free one. */
function keyLetters(ids: string[]): Map<string, string> {
  const letters = new Map<string, string>()
  const taken = new Set<string>()
  for (const id of ids) {
    if (letters.has(id)) continue
    const name = id.replace(/^#?[^:]*:/, "").replace(/[^a-z]/g, "").toUpperCase()
    const letter = [...name, ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].find((c) => !taken.has(c))!
    letters.set(id, letter)
    taken.add(letter)
  }
  return letters
}

/** The recipe as Minecraft's JSON, or null while it is incomplete or points at deleted things. */
export function recipeJson(recipe: RecipeElement, ctx: GenerateContext): Record<string, unknown> | null {
  const d = recipe.data
  const project = ctx.project
  const result = d.result ? resolveRef(d.result, project) : null
  if (!result || result.startsWith("#")) return null
  const out = { id: result, ...(d.count > 1 ? { count: d.count } : {}) }
  // 26.1.2 crafting recipes carry a recipe book category; 26.3 dropped it.
  const craftingCategory = atLeast(ctx, "26.3") ? {} : { category: "misc" }

  if (d.kind === "shaped") {
    const rows = trimmedRows(d.grid.map((c) => (c ? resolveRef(c, project) : null)))
    const ids = rows.flat().filter((c): c is string => c !== null)
    if (ids.length === 0 || d.grid.some((c) => c && !resolveRef(c, project))) return null
    const letters = keyLetters(ids)
    return {
      type: "minecraft:crafting_shaped",
      ...craftingCategory,
      key: Object.fromEntries([...letters].map(([id, letter]) => [letter, id])),
      pattern: rows.map((row) => row.map((c) => (c ? letters.get(c)! : " ")).join("")),
      result: out,
    }
  }
  if (d.kind === "shapeless") {
    const ids = d.grid.filter((c): c is string => c !== null).map((c) => resolveRef(c, project))
    if (ids.length === 0 || ids.some((c) => c === null)) return null
    return { type: "minecraft:crafting_shapeless", ...craftingCategory, ingredients: ids, result: out }
  }

  const ingredient = d.ingredient ? resolveRef(d.ingredient, project) : null
  if (!ingredient) return null
  if (d.kind === "stonecutting") return { type: "minecraft:stonecutting", ingredient, result: out }
  // 26.3 blast furnaces and smokers cook twice as fast by themselves, so vanilla doubled
  // their recipe times. Doubling here keeps the seconds you typed true on both versions.
  const fast = d.kind === "blasting" || d.kind === "smoking"
  const cookingtime = fast && atLeast(ctx, "26.3") ? d.cookingTime * 2 : d.cookingTime
  return { type: `minecraft:${d.kind}`, category: d.category, cookingtime, experience: d.experience, ingredient, result: out }
}

/** The adapter the generator calls for each recipe: its JSON file (nothing while incomplete). */
export function recipeTemplate(recipe: RecipeElement, ctx: GenerateContext): GeneratedFile[] {
  const json = recipeJson(recipe, ctx)
  if (!json) return []
  return [{ path: `${ctx.paths.resources}/data/${ctx.project.modId}/recipe/${recipe.id}.json`, contents: `${JSON.stringify(json, null, 2)}\n` }]
}
