// The Recipe element's data. One recipe = one way to make something.
//
//   shaped / shapeless     grid: 9 slots (3x3, row by row); shapeless ignores positions
//   smelting / blasting /  ingredient -> result, with cooking time and experience
//   smoking / stonecutting
//
// Slots hold references: "minecraft:wheat", "#minecraft:planks", "berry_dough" (this mod).
import { z } from "zod"

export const RECIPE_KINDS = ["shaped", "shapeless", "smelting", "blasting", "smoking", "stonecutting"] as const
export type RecipeKind = (typeof RECIPE_KINDS)[number]

export const COOKING_KINDS: RecipeKind[] = ["smelting", "blasting", "smoking"]
export const isCooking = (kind: RecipeKind) => COOKING_KINDS.includes(kind)
export const isCrafting = (kind: RecipeKind) => kind === "shaped" || kind === "shapeless"

/** Vanilla cooking times in ticks: a furnace takes 200, blast furnaces and smokers 100. */
export const DEFAULT_COOKING_TIME: Record<string, number> = { smelting: 200, blasting: 100, smoking: 100 }

const ref = z.string().min(1).max(200)

export const recipeSchema = z.object({
  kind: z.enum(RECIPE_KINDS),
  /** Crafting slots, row by row (index = row * 3 + column). Null = empty slot. */
  grid: z.array(ref.nullable()).length(9),
  /** The one input of cooking and stonecutting recipes. */
  ingredient: ref.nullable(),
  /** What the recipe makes. Null until picked (the recipe isn't built until then). */
  result: ref.nullable(),
  count: z.number().int().min(1).max(99),
  /** Cooking only: ticks to cook one item (20 ticks = 1 second). */
  cookingTime: z.number().int().min(1).max(32000),
  /** Cooking only: experience dropped per item. */
  experience: z.number().min(0).max(100),
  /** Cooking only: which recipe book tab it shows in. */
  category: z.enum(["food", "blocks", "misc"]),
})

export type RecipeData = z.infer<typeof recipeSchema>

/** A new recipe: an empty shaped crafting grid. */
export const recipeDefaults = (): RecipeData => ({
  kind: "shaped",
  grid: Array(9).fill(null),
  ingredient: null,
  result: null,
  count: 1,
  cookingTime: 200,
  experience: 0.1,
  category: "misc",
})

/** What still blocks the recipe from being built (empty = ready). Plain-language for the UI. */
export function recipeProblems(data: RecipeData): string[] {
  const problems: string[] = []
  if (!data.result) problems.push("Pick what the recipe makes")
  if (isCrafting(data.kind) && data.grid.every((s) => s === null)) problems.push("Put at least one ingredient in the grid")
  if (!isCrafting(data.kind) && !data.ingredient) problems.push("Pick the ingredient")
  return problems
}

/** Switching kinds keeps what fits: the grid's first item becomes the ingredient, and back. */
export function changeKind(data: RecipeData, kind: RecipeKind): RecipeData {
  const firstGrid = data.grid.find((s) => s !== null) ?? null
  const grid = isCrafting(kind) && !data.grid.some(Boolean) && data.ingredient ? [data.ingredient, ...Array(8).fill(null)] : data.grid
  return {
    ...data,
    kind,
    grid,
    ingredient: !isCrafting(kind) ? (data.ingredient ?? firstGrid) : data.ingredient,
    cookingTime: isCooking(kind) && isCooking(data.kind) ? data.cookingTime : (DEFAULT_COOKING_TIME[kind] ?? data.cookingTime),
  }
}
