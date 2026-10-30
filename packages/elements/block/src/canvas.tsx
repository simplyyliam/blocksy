// The Block's canvas: what fills the project editor when a block is selected.
// A live 3D preview on a quiet dot grid (Magic UI Dot Pattern), drag to turn it.
import type { ElementEditorProps } from "@blocksy/core"
import { BlockPreview } from "@blocksy/model-studio"
import { DotPattern, useThemeToken } from "@blocksy/ui"
import { pngDataUrl } from "./png.ts"
import type { BlockData } from "./schema.ts"

export function BlockCanvas({ element }: ElementEditorProps<BlockData>) {
  const placeholder = useThemeToken("surface-pressed")
  const shadow = useThemeToken("fg")
  const texture = element.data.texture ? pngDataUrl(element.data.texture) : null
  return (
    <div className="relative size-full">
      {/* The dot grid fades out towards the edges, so the block sits in a soft spotlight. */}
      <DotPattern width={18} height={18} cr={0.9} className="text-line [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
      <BlockPreview className="absolute! inset-0" model={{ textures: { all: texture } }} placeholder={placeholder} shadow={shadow} />
      {!texture && (
        <p className="pointer-events-none absolute inset-x-0 bottom-24 text-center text-sm text-fg-muted">
          No texture yet. Import a 16x16 PNG in the inspector.
        </p>
      )}
    </div>
  )
}
