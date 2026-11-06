// Live validation for the New project form: pure functions with clear, friendly messages (tested).
// The rules mirror the project schema in core (MOD_ID_PATTERN, PACKAGE_PATTERN) and add the ones that
// only matter when making a new project: reserved ids, Java keywords, and a folder that already exists.
import { deriveModId, MOD_ID_PATTERN, PACKAGE_PATTERN } from "@blocksy/core"

/** Mod IDs other mods and the game already use: a clash would break loading. */
export const RESERVED_MOD_IDS = ["minecraft", "java", "fabric", "fabricloader", "fabric_api", "mixin", "neoforge", "forge", "quilt", "blocksy"]

/** Java keywords can't be part of a package name (the mod ID is the last part of it). */
const JAVA_KEYWORDS = new Set(
  ("abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if " +
    "implements import instanceof int interface long native new package private protected public return short static strictfp super switch " +
    "synchronized this throw throws transient try void volatile while true false null _").split(" "),
)

export interface NewProjectFields {
  name: string
  modId: string
  group: string
  location: string
  /** The parent folder already holds something called `modId`. null while we have not looked yet. */
  folderExists: boolean | null
}

export type FieldProblems = Partial<Record<"name" | "modId" | "group" | "location", string>>

/** The mod ID that follows the name until someone edits it (empty while there is no name). */
export const modIdFromName = (name: string) => (name.trim() ? deriveModId(name) : "")

export function modIdProblem(modId: string): string | null {
  if (!modId) return "Give the mod an ID (it is made from the name)"
  if (modId.length < 2) return "The mod ID needs at least 2 characters"
  if (modId.length > 64) return "The mod ID can be at most 64 characters"
  if (/^[0-9_]/.test(modId)) return "The mod ID must start with a lowercase letter"
  if (!MOD_ID_PATTERN.test(modId)) return "Use lowercase letters, digits and _ only (no spaces or capitals)"
  if (RESERVED_MOD_IDS.includes(modId)) return `"${modId}" is already used by the game or the mod loader. Pick another mod ID`
  if (JAVA_KEYWORDS.has(modId)) return `"${modId}" is a Java word and can't be a mod ID. Pick another`
  return null
}

export function groupProblem(group: string): string | null {
  if (!group) return "Enter a Java package, like com.example"
  if (!PACKAGE_PATTERN.test(group)) return "Use a Java package like com.example: lowercase words separated by dots"
  const keyword = group.split(".").find((part) => JAVA_KEYWORDS.has(part))
  if (keyword) return `"${keyword}" is a Java word and can't be part of a package`
  return null
}

/** Every problem in the form right now (empty object = ready to create). */
export function validateNewProject(fields: NewProjectFields): FieldProblems {
  const problems: FieldProblems = {}
  if (!fields.name.trim()) problems.name = "Give your mod a name"
  const modId = modIdProblem(fields.modId)
  if (modId) problems.modId = modId
  const group = groupProblem(fields.group)
  if (group) problems.group = group
  if (!fields.location.trim()) problems.location = "Choose where to create the project"
  else if (fields.folderExists) problems.location = `A folder named "${fields.modId}" already exists there. Change the mod ID or the location`
  return problems
}

/** The full Java package the code goes in: group + mod ID (the Fabric layout). */
export const javaPackage = (group: string, modId: string) => `${group}.${modId || "mod_id"}`
