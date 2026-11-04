// @blocksy/element-language: the Language element, i.e. the lang editor (schema, translation
// table, inspector, Docs reference data, tests). Loader code lives in each target.
// Public API of this package. Other packages may import only from here.
import { Languages } from "lucide-react"
import { LanguageCanvas, LanguageInspector } from "./editor.tsx"
import { languageElement } from "./element.ts"

export { languageElement } from "./element.ts"
export { languageDefaults, languageSchema, LOCALES, localeName, progress, projectKeys, type LanguageData } from "./schema.ts"
export { LanguageCanvas, LanguageInspector }

/** Everything the app registers for languages, in one object (one registration line). */
export const languageModule = { type: languageElement, Inspector: LanguageInspector, Canvas: LanguageCanvas, Icon: Languages }
