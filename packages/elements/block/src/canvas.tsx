// The Block's canvas. Three modes (the mode bar above the canvas picks one):
//   Paint  the paint studio on the block's texture, with a live cube and tiled preview
//   Model  a stub: shaping the block's model arrives with Model Studio
//   Look   the block in 3D, drag to turn it (and its light, once set, makes it glow)
// Painting commits through `change`, so every stroke is one undo step.
import type { ElementEditorProps } from "@blocksy/core"
import { BlockPreview } from "@blocksy/model-studio"
import { PaintStudio } from "@blocksy/pixel"
import { useState } from "react"
import { CanvasLoader, CanvasBackdrop, useThemeToken } from "@blocksy/ui"
import { pngDataUrl } from "./png.ts"
import type { BlockData } from "./schema.ts"

function BlockLook({ element }: ElementEditorProps<BlockData>) {
  const placeholder = useThemeToken("surface-pressed")
  const shadow = useThemeToken("black") // a shadow stays dark in every theme
  const texture = element.data.texture ? pngDataUrl(element.data.texture) : null
  // The first preview takes a moment (WebGL, shaders): show a loader until it's drawn.
  const [ready, setReady] = useState(false)
  return (
    <div className="relative size-full">
      {/* The dot grid fades out towards the edges, so the block sits in a soft spotlight. */}
      <CanvasBackdrop />
      <BlockPreview className="absolute! inset-0" model={{ textures: { all: texture } }} placeholder={placeholder} shadow={shadow} onReady={() => setReady(true)} />
      <CanvasLoader ready={ready} label="Loading 3D preview" />
      {ready && !texture && <p className="pointer-events-none absolute inset-x-0 bottom-24 text-center text-sm text-fg-muted">No texture yet. Paint one in Paint mode.</p>}
    </div>
  )
}

export function BlockCanvas(props: ElementEditorProps<BlockData>) {
  const { element, change, mode } = props
  const data = element.data
  if (mode === "look") return <BlockLook {...props} />
  if (mode === "model") {
    return (
      <div className="relative grid size-full place-items-center">
        <CanvasBackdrop />
        <div className="relative max-w-sm rounded-lg bg-bg/95 px-5 py-4 text-center shadow-md">
          <p className="text-sm text-fg">Model mode comes with Model Studio</p>
          <p className="mt-1 text-xs text-fg-muted">Until then every block is a full cube with one texture on all faces. Paint it in Paint mode.</p>
        </div>
      </div>
    )
  }
  return (
    <div className="relative size-full">
      <CanvasBackdrop />
      <PaintStudio
        kind="block"
        size={16}
        value={{ png: data.texture, animation: null, layers: data.layers }}
        onChange={(v) => change({ ...data, texture: v.png, layers: v.layers ?? null })}
      />
    </div>
  )
}
