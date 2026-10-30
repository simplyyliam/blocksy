// The Block's canvas: what fills the project editor when a block is selected.
// A live 3D preview on a quiet dot grid (Magic UI Dot Pattern), drag to turn it.
import type { ElementEditorProps } from "@blocksy/core"
import { BlockPreview } from "@blocksy/model-studio"
import { useState } from "react"
import { CanvasLoader, DotPattern, useThemeToken } from "@blocksy/ui"
import { pngDataUrl } from "./png.ts"
import type { BlockData } from "./schema.ts"

export function BlockCanvas({ element }: ElementEditorProps<BlockData>) {
  const placeholder = useThemeToken("surface-pressed")
  const shadow = useThemeToken("black") // a shadow stays dark in every theme
  const texture = element.data.texture ? pngDataUrl(element.data.texture) : null
  // The first preview takes a moment (WebGL, shaders): show a loader until it's drawn.
  const [ready, setReady] = useState(false)
  return (
    <div className="relative size-full">
      {/* The dot grid fades out towards the edges, so the block sits in a soft spotlight. */}
      <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_85%)]">
        <DotPattern width={18} height={18} cr={0.9} className="text-fg-faint opacity-60" />
      </div>
      <BlockPreview className="absolute! inset-0" model={{ textures: { all: texture } }} placeholder={placeholder} shadow={shadow} onReady={() => setReady(true)} />
      <CanvasLoader ready={ready} label="Loading 3D preview" />
      {ready && !texture && (
        <p className="pointer-events-none absolute inset-x-0 bottom-24 text-center text-sm text-fg-muted">
          No texture yet. Import a 16x16 PNG in the inspector.
        </p>
      )}
    </div>
  )
}
