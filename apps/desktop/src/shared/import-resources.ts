// Typed imports (Resources menu): a block texture or an item texture from a PNG on disk.
//   - the selected element is of that type  -> its texture is replaced (one undo step)
//   - otherwise                              -> a new block or item is made from the picture
// The element's own schema checks the picture (16 wide; blocks 16 tall; items 16 tall or a
// strip of frames), so the rules live in one place and the message is the schema's.
// GUI and particle textures, sounds and models need their studios first (GUI Studio, effects,
// Model Studio); until then those menu entries stay greyed out.
import { updateElement } from "@blocksy/core"
import { pngSize } from "@blocksy/pixel"
import { toast } from "@blocksy/ui"
import { registries } from "../app/modules"
import { createElement, newElementData, selectedElement } from "./element-actions"
import { nameFromFile } from "./name-from-file"
import { useProject } from "./stores/project"

export type TextureImport = "block" | "item"

const MAX_BYTES = 512 * 1024

/** Opens the system file picker for PNGs. Resolves null when cancelled. */
function pickPng(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/png"
    input.onchange = () => resolve(input.files?.[0] ?? null)
    input.oncancel = () => resolve(null)
    input.click()
  })
}

function readBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "")
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export async function importTexture(type: TextureImport) {
  const project = useProject.getState().current
  const file = await pickPng()
  if (!project || !file) return
  try {
    if (file.size > MAX_BYTES) throw new Error("That file is too big for a texture")
    const texture = await readBase64(file)
    if (!pngSize(texture)) throw new Error("That is not a PNG picture")

    const module = registries.elementTypes.require(type)
    // A strip of frames is an animation: keep the item's own settings, or the defaults.
    const size = pngSize(texture)!
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
    toast.error(err instanceof Error ? err.message : String(err))
  }
}
