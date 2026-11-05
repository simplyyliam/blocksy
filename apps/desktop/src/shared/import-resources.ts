// Typed imports (Resources menu and drag-and-drop from the desktop).
//
//   Block / item texture   the selected element of that type gets the picture (one undo step),
//                          otherwise a new block or item is made from it. The element's own
//                          schema checks the picture, so the rules live in one place.
//   GUI / particle texture, sound, model
//                          become a resource in the project document (packages/core/resources.ts
//                          holds the format, size and name checks). The generator writes the file
//                          into the right mod folder and the project tree lists it. Undo removes it.
import { addResource, RESOURCE_INFO, uniqueResourceName, updateElement, validateResource, type ResourceKind } from "@blocksy/core"
import { pngSize } from "@blocksy/pixel"
import { toast } from "@blocksy/ui"
import { registries } from "../app/modules"
import { routeDroppedFile } from "./drop-route"
import { createElement, newElementData, selectedElement } from "./element-actions"
import { nameFromFile } from "./name-from-file"
import { useProject } from "./stores/project"

export type TextureImport = "block" | "item"

const MAX_BYTES = 512 * 1024

/** Opens the system file picker. Resolves null when cancelled. */
function pickFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = accept
    input.onchange = () => resolve(input.files?.[0] ?? null)
    input.oncancel = () => resolve(null)
    input.click()
  })
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = ""
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}

const fail = (err: unknown) => toast.error(err instanceof Error ? err.message : String(err))

export async function importTexture(type: TextureImport, dropped?: File) {
  const project = useProject.getState().current
  const file = dropped ?? (await pickFile("image/png"))
  if (!project || !file) return
  try {
    if (file.size > MAX_BYTES) throw new Error("That file is too big for a texture")
    const texture = bytesToBase64(new Uint8Array(await file.arrayBuffer()))
    const size = pngSize(texture)
    if (!size) throw new Error("That is not a PNG picture")

    const module = registries.elementTypes.require(type)
    // A strip of frames is an animation: keep the item's own settings, or the defaults.
    const animated = type === "item" && size.height > size.width
    const selected = selectedElement()
    const replacing = selected?.type === type
    // The data the picture goes into: the selected element's own, or a new element's starting data.
    const withTexture = (from: unknown) => {
      const base = from as Record<string, unknown>
      return {
        ...base,
        texture,
        layers: null,
        ...(type === "item" ? { animation: animated ? ((base.animation as object | null) ?? { frametime: 4, interpolate: false }) : null } : {}),
      }
    }
    const data = withTexture(replacing ? selected.data : newElementData(type))
    const checked = module.schema.safeParse(data)
    if (!checked.success) throw new Error(checked.error.issues[0]?.message ?? "That picture doesn't fit")

    if (replacing) {
      project.documents.execute(updateElement(selected.id, data))
      toast(`Texture of ${selected.name} replaced`)
    } else {
      createElement(type, nameFromFile(file.name), withTexture)
      toast(`Made a new ${type} from ${file.name}`)
    }
  } catch (err) {
    fail(err)
  }
}

const ACCEPT: Record<ResourceKind, string> = {
  "gui-texture": "image/png",
  "particle-texture": "image/png",
  sound: ".ogg,audio/ogg",
  model: ".json,.bbmodel",
}

/** Imports one file as a GUI texture, particle texture, sound or model (picker when no file is given). */
export async function importResource(kind: ResourceKind, dropped?: File) {
  const project = useProject.getState().current
  const file = dropped ?? (await pickFile(ACCEPT[kind]))
  if (!project || !file) return
  try {
    const bytes = new Uint8Array(await file.arrayBuffer())
    const checked = validateResource(kind, file.name, bytes)
    if (!checked.ok) throw new Error(checked.error)
    const name = uniqueResourceName(project.doc, kind, checked.name)
    project.documents.execute(addResource({ kind, name, ext: checked.ext, data: bytesToBase64(bytes) }))
    toast(`${RESOURCE_INFO[kind].label} ${name} imported`)
  } catch (err) {
    fail(err)
  }
}

/** Handles files dropped on the project window; each one is imported on its own. */
export async function importDroppedFiles(files: File[]) {
  for (const file of files) {
    const route = routeDroppedFile(file.name, selectedElement()?.type)
    if (!route) {
      toast.error(`${file.name}: Blocksy imports .png, .ogg, .json and .bbmodel files`)
    } else if (route.to === "texture") {
      await importTexture(route.type, file)
    } else {
      await importResource(route.kind, file)
    }
  }
}
