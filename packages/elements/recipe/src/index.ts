// @blocksy/element-recipe: the Recipe element (schema, crafting-grid canvas, inspector,
// Docs reference data, tests). Loader code lives in each target's adapter (ADR 0009).
// Public API of this package. Other packages may import only from here.
import { Grid3x3 } from "lucide-react"
import { RecipeCanvas } from "./canvas.tsx"
import { recipeElement } from "./element.ts"
import { RecipeInspector } from "./inspector.tsx"

export { recipeElement } from "./element.ts"
export {
  changeKind, COOKING_KINDS, DEFAULT_COOKING_TIME, isCooking, isCrafting, RECIPE_KINDS, recipeDefaults, recipeProblems, recipeSchema,
  type RecipeData, type RecipeKind,
} from "./schema.ts"
export { RecipeCanvas, RecipeInspector }

/** Everything the app registers for recipes, in one object (one registration line). */
export const recipeModule = { type: recipeElement, Inspector: RecipeInspector, Canvas: RecipeCanvas, Icon: Grid3x3 }
