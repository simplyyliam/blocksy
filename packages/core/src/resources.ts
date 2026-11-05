// Imported resources: GUI textures, particle textures, sounds and models that come from files
// on disk. They are plain data in the project document (base64), so imports are undoable and
// the generator can write them into the mod. Everything here is pure: the rules that decide
// "is this file acceptable?" live in one place and run the same in the app and in tests.
//
//   file on disk ──validateResource──▶ { kind, name, ext, data } ──addResource──▶ document
//                                                                      └─ generator writes it
//
// `resources` is an optional list next to `elements`, so no formatVersion change is needed
// (old projects simply have none).
import { z } from "zod"
import type { Command } from "./commands.ts"
import type { Project } from "./project.ts"

export const RESOURCE_KINDS = ["gui-texture", "particle-texture", "sound", "model"] as const
export type ResourceKind = (typeof RESOURCE_KINDS)[number]

/** Resource names end up in file paths and Minecraft ids: lowercase letters, digits, _ and -. */
export const RESOURCE_NAME_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/

export const resourceSchema = z.object({
  kind: z.enum(RESOURCE_KINDS),
  name: z.string().regex(RESOURCE_NAME_PATTERN, "Resource names use lowercase letters, digits, _ and -"),
  /** File extension without the dot: png, ogg, json or bbmodel. */
  ext: z.enum(["png", "ogg", "json", "bbmodel"]),
  /** The file's bytes, base64. */
  data: z.string().min(1),
})
export type Resource = z.infer<typeof resourceSchema>

/** What the Resources menu, the tree and the messages need to know about each kind. */
export const RESOURCE_INFO: Record<ResourceKind, { label: string; plural: string; extensions: string[]; maxBytes: number }> = {
  "gui-texture": { label: "GUI texture", plural: "GUI textures", extensions: ["png"], maxBytes: 512 * 1024 },
  "particle-texture": { label: "Particle texture", plural: "Particle textures", extensions: ["png"], maxBytes: 64 * 1024 },
  sound: { label: "Sound", plural: "Sounds", extensions: ["ogg"], maxBytes: 2 * 1024 * 1024 },
  model: { label: "Model", plural: "Models", extensions: ["json", "bbmodel"], maxBytes: 4 * 1024 * 1024 },
}

const MAX_GUI_SIDE = 1024
const MAX_PARTICLE_SIDE = 256

export type ResourceCheck = { ok: true; name: string; ext: Resource["ext"] } | { ok: false; error: string }

/** "Cool Sound!.OGG" -> "cool_sound". Empty when nothing usable is left. */
export function resourceNameFromFile(fileName: string): string {
  const stem = fileName.replace(/^.*[\\/]/, "").replace(/\.[^.]*$/, "")
  return stem
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\s.]+/g, "_")
    .replace(/[^a-z0-9_-]/g, "")
    .replace(/^[_-]+/, "")
    .slice(0, 48)
}

/** A name not used yet by this kind: "spark", then "spark_2". */
export function uniqueResourceName(project: Project, kind: ResourceKind, wanted: string): string {
  const taken = new Set((project.resources ?? []).filter((r) => r.kind === kind).map((r) => r.name))
  if (!taken.has(wanted)) return wanted
  let n = 2
  while (taken.has(`${wanted}_${n}`)) n++
  return `${wanted}_${n}`
}

function pngDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  if (bytes.length < 24 || signature.some((b, i) => bytes[i] !== b)) return null
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const width = view.getUint32(16)
  const height = view.getUint32(20)
  return width > 0 && height > 0 ? { width, height } : null
}

/** Ogg container whose first stream is Vorbis (Minecraft plays no other sound format). */
function isOggVorbis(bytes: Uint8Array): boolean {
  const head = String.fromCharCode(...bytes.subarray(0, 64))
  return head.startsWith("OggS") && head.includes("\u0001vorbis")
}

function parseJsonObject(bytes: Uint8Array): Record<string, unknown> | null {
  try {
    // Strict UTF-8 (throws on bad bytes) without TextDecoder, which core's environment doesn't have.
    let percent = ""
    for (const b of bytes) percent += `%${b.toString(16).padStart(2, "0")}`
    const value: unknown = JSON.parse(decodeURIComponent(percent))
    return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null
  } catch {
    return null
  }
}

/** Checks a file's name, format and size for one kind. The message is shown to the user as is. */
export function validateResource(kind: ResourceKind, fileName: string, bytes: Uint8Array): ResourceCheck {
  const info = RESOURCE_INFO[kind]
  const ext = fileName.slice(fileName.lastIndexOf(".") + 1).toLowerCase()
  if (!fileName.includes(".") || !info.extensions.includes(ext)) {
    return { ok: false, error: `A ${info.label.toLowerCase()} must be a .${info.extensions.join(" or .")} file` }
  }
  if (bytes.length === 0) return { ok: false, error: "That file is empty" }
  if (bytes.length > info.maxBytes) {
    return { ok: false, error: `That file is too big for a ${info.label.toLowerCase()} (limit ${Math.round(info.maxBytes / 1024)} KB)` }
  }
  const name = resourceNameFromFile(fileName)
  if (!name) return { ok: false, error: "Rename the file with letters or digits first" }

  if (kind === "gui-texture" || kind === "particle-texture") {
    const size = pngDimensions(bytes)
    if (!size) return { ok: false, error: "That is not a PNG picture" }
    const max = kind === "gui-texture" ? MAX_GUI_SIDE : MAX_PARTICLE_SIDE
    if (size.width > max || size.height > max) {
      return { ok: false, error: `A ${info.label.toLowerCase()} can be at most ${max}×${max} pixels (this one is ${size.width}×${size.height})` }
    }
  } else if (kind === "sound") {
    if (!isOggVorbis(bytes)) return { ok: false, error: "That is not an Ogg Vorbis sound (Minecraft needs .ogg)" }
  } else {
    const json = parseJsonObject(bytes)
    if (!json) return { ok: false, error: "That model file is not valid JSON" }
    if (ext === "bbmodel") {
      if (!json.meta || !Array.isArray(json.elements)) return { ok: false, error: "That is not a Blockbench model (no meta or elements)" }
    } else if (!Array.isArray(json.elements) && typeof json.parent !== "string") {
      return { ok: false, error: "That model JSON has no elements and no parent" }
    }
  }
  return { ok: true, name, ext: ext as Resource["ext"] }
}

/** Where a resource is written: inside the mod's assets folder, or at the project root. */
export function resourcePlace(resource: Resource): { root: "assets" | "project"; path: string } {
  switch (resource.kind) {
    case "gui-texture":
      return { root: "assets", path: `textures/gui/${resource.name}.png` }
    case "particle-texture":
      return { root: "assets", path: `textures/particle/${resource.name}.png` }
    case "sound":
      return { root: "assets", path: `sounds/${resource.name}.ogg` }
    case "model":
      // A Blockbench file is a source for editing, not something Minecraft loads: keep it out of the jar.
      return resource.ext === "bbmodel"
        ? { root: "project", path: `blockbench/${resource.name}.bbmodel` }
        : { root: "assets", path: `models/imported/${resource.name}.json` }
  }
}

export const addResource = (resource: Resource): Command<Project> => ({
  label: `Import ${resource.name}`,
  run: (p) => ({ ...p, resources: [...(p.resources ?? []), resource] }),
})

export const removeResource = (kind: ResourceKind, name: string): Command<Project> => ({
  label: `Remove ${name}`,
  run: (p) => ({ ...p, resources: (p.resources ?? []).filter((r) => !(r.kind === kind && r.name === name)) }),
})
