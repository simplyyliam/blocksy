// The Language element type. Loader code (writing lang/<locale>.json) lives in each target.
import type { ElementType } from "@blocksy/core"
import { languageDocs } from "./docs.ts"
import { languageDefaults, languageSchema, type LanguageData } from "./schema.ts"

export const languageElement: ElementType<LanguageData> = {
  id: "language",
  name: "Language",
  plural: "Languages",
  schema: languageSchema,
  defaults: languageDefaults,
  templates: {},
  docs: languageDocs,
}
