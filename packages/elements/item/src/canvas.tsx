// The Item's canvas: what fills the project editor when an item is selected.
// The pixel texture editor from @blocksy/pixel, on a quiet dot grid. Painting commits
// through `change`, so every stroke is one undo step.
import type { ElementEditorProps } from "@blocksy/core"
import { TextureEditor } from "@blocksy/pixel"
import { CanvasBackdrop } from "@blocksy/ui"
import { TEXTURE_SIZE, type ItemData } from "./schema.ts"

export function ItemCanvas({ element, change }: ElementEditorProps<ItemData>) {
  const data = element.data
  return (
    <div className="relative size-full">
      <CanvasBackdrop />
      <TextureEditor
        className="absolute inset-0"
        size={TEXTURE_SIZE}
        value={{ png: data.texture, animation: data.animation }}
        onChange={(v) => change({ ...data, texture: v.png, animation: v.animation })}
      />
    </div>
  )
}
