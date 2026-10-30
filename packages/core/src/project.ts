// The project file: everything about one mod, as plain versioned data.
// It is saved as `blocksy.json` in the project folder. Editors never hold
// their own copy; they change this document through commands (commands.ts).
import { z } from "zod"

/** Bump this only together with a new migration (see migrations.ts). */
export const CURRENT_FORMAT_VERSION = 1

/** Mod IDs: lowercase letters, digits and underscores, starting with a letter. */
export const MOD_ID_PATTERN = /^[a-z][a-z0-9_]{1,63}$/

/** Java package names like `com.example.mymod`. */
export const PACKAGE_PATTERN = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/

/** One element in the mod (a block, an item, ...). `data` is checked by its element type. */
export const elementSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  name: z.string().min(1),
  data: z.unknown(),
})

export const projectSchema = z.object({
  formatVersion: z.literal(CURRENT_FORMAT_VERSION),
  name: z.string().trim().min(1, "Give your mod a name"),
  modId: z.string().regex(MOD_ID_PATTERN, "Use lowercase letters, digits and _"),
  group: z.string().regex(PACKAGE_PATTERN, "Use a Java package like com.example"),
  version: z.string().min(1),
  /** Loader target id, for example "fabric". Core never interprets it. */
  target: z.string().min(1),
  minecraftVersion: z.string().min(1),
  elements: z.array(elementSchema),
})

export type Element = z.infer<typeof elementSchema>
export type Project = z.infer<typeof projectSchema>

export interface NewProjectInput {
  name: string
  target: string
  minecraftVersion: string
  modId?: string
  group?: string
}

/** Builds a fresh, valid project from the New project dialog's answers. */
export function createProject(input: NewProjectInput): Project {
  return projectSchema.parse({
    formatVersion: CURRENT_FORMAT_VERSION,
    name: input.name.trim(),
    modId: input.modId || deriveModId(input.name),
    group: input.group || "com.example",
    version: "1.0.0",
    target: input.target,
    minecraftVersion: input.minecraftVersion,
    elements: [],
  })
}

/** "Aetheric Storage Engineering" -> "aetheric_storage_engineering". */
export function deriveModId(name: string): string {
  const id = name
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/^[^a-z]+/, "")
    .slice(0, 64)
  return id.length >= 2 ? id : "my_first_mod"
}

/** "Aetheric Storage Engineering" -> "AethericStorageEngineering" (a Java class name). */
export function deriveClassName(name: string): string {
  const words = name.normalize("NFKD").replace(/[^A-Za-z0-9\s]/g, " ").split(/\s+/).filter(Boolean)
  const joined = words.map((w) => w[0]!.toUpperCase() + w.slice(1)).join("")
  return /^[A-Za-z]/.test(joined) ? joined : `Mod${joined}`
}

/**
 * A Minecraft-safe id for a new element, unique in the project:
 * "Ruby Block" -> "ruby_block", then "ruby_block_2" if that is taken.
 * The id never changes after creation (worlds save blocks by id), even on rename.
 */
export function deriveElementId(name: string, taken: Iterable<string>): string {
  const base =
    name
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_")
      .replace(/^[^a-z]+/, "")
      .slice(0, 48) || "element"
  const used = new Set(taken)
  if (!used.has(base)) return base
  let n = 2
  while (used.has(`${base}_${n}`)) n++
  return `${base}_${n}`
}
