// The Recipe element type, as registered in the element registry. Loader code (the recipe
// JSON and where it goes) lives in each target's adapter (ADR 0006, 0009).
import type { ElementType } from "@blocksy/core"
import { recipeDocs } from "./docs.ts"
import { recipeDefaults, recipeSchema, type RecipeData } from "./schema.ts"

export const recipeElement: ElementType<RecipeData> = {
  id: "recipe",
  name: "Recipe",
  plural: "Recipes",
  schema: recipeSchema,
  defaults: recipeDefaults,
  templates: {},
  docs: recipeDocs,
}
