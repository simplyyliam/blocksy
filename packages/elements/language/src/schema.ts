// The Language element's data: translations for one language.
//
//   locale "de_de", entries { "item.berry_mod.berry_bun": "Beerenbrötchen" }
//
// Keys come from the elements themselves (ElementType.lang); entries for keys the project
// doesn't make are "custom keys" (for your own Java code later). Empty text = not translated,
// so Minecraft falls back to English for that key.
import type { ElementType, Project } from "@blocksy/core"
import { z } from "zod"

/** Minecraft's language codes, as used for lang/<code>.json (a common subset). */
export const LOCALES = [
  { id: "en_us", name: "English (US)" },
  { id: "en_gb", name: "English (UK)" },
  { id: "de_de", name: "German" },
  { id: "fr_fr", name: "French" },
  { id: "es_es", name: "Spanish (Spain)" },
  { id: "es_mx", name: "Spanish (Mexico)" },
  { id: "it_it", name: "Italian" },
  { id: "nl_nl", name: "Dutch" },
  { id: "pt_br", name: "Portuguese (Brazil)" },
  { id: "pt_pt", name: "Portuguese (Portugal)" },
  { id: "pl_pl", name: "Polish" },
  { id: "cs_cz", name: "Czech" },
  { id: "sv_se", name: "Swedish" },
  { id: "da_dk", name: "Danish" },
  { id: "fi_fi", name: "Finnish" },
  { id: "nb_no", name: "Norwegian" },
  { id: "tr_tr", name: "Turkish" },
  { id: "ru_ru", name: "Russian" },
  { id: "uk_ua", name: "Ukrainian" },
  { id: "ja_jp", name: "Japanese" },
  { id: "ko_kr", name: "Korean" },
  { id: "zh_cn", name: "Chinese (Simplified)" },
  { id: "zh_tw", name: "Chinese (Traditional)" },
] as const

/** Language codes: two lowercase parts joined by _ (Minecraft also has a few like "lol_us"). */
export const LOCALE_PATTERN = /^[a-z]{2,3}_[a-z]{2,3}$/

/** Translation keys: dotted lowercase words, like item.my_mod.ruby.tooltip.0. */
export const KEY_PATTERN = /^[a-zA-Z0-9_.-]+$/

export const languageSchema = z.object({
  locale: z.string().regex(LOCALE_PATTERN, "Use a language code like de_de"),
  entries: z.record(z.string().regex(KEY_PATTERN, "Keys use letters, digits, dots, _ and -"), z.string().max(1000)),
})

export type LanguageData = z.infer<typeof languageSchema>

export const languageDefaults = (): LanguageData => ({ locale: "de_de", entries: {} })

export const localeName = (locale: string) => LOCALES.find((l) => l.id === locale)?.name ?? locale

/** Every key the project makes, with its English text, in project order. */
export function projectKeys(project: Project, types: ElementType[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const element of project.elements) {
    const type = types.find((t) => t.id === element.type)
    Object.assign(out, type?.lang?.(element as never, project) ?? {})
  }
  return out
}

/** How many project keys have a translation. */
export function progress(data: LanguageData, keys: string[]): { done: number; total: number } {
  return { done: keys.filter((k) => (data.entries[k] ?? "").trim() !== "").length, total: keys.length }
}
