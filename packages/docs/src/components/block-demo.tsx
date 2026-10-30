// A live demo: the real block preview from the editor, in a sandbox (plan 11.2).
// It renders on demand like everywhere else, so an idle demo costs nothing.
import { starterTexture } from "@blocksy/element-block"
import { BlockPreview } from "@blocksy/model-studio"
import { useState } from "react"
import { CanvasLoader, useThemeToken } from "@blocksy/ui"

const texture = `data:image/png;base64,${starterTexture()}`

export function BlockDemo({ caption = "Drag to turn it. This is the same preview as in the project editor." }: { caption?: string }) {
  const placeholder = useThemeToken("surface-pressed")
  const shadow = useThemeToken("fg")
  const [ready, setReady] = useState(false)
  return (
    <figure className="not-prose my-6">
      <div className="relative h-64 overflow-hidden rounded-xl bg-fd-muted">
        <BlockPreview className="absolute! inset-0" model={{ textures: { all: texture } }} placeholder={placeholder} shadow={shadow} onReady={() => setReady(true)} />
        <CanvasLoader ready={ready} label="Loading demo" />
      </div>
      <figcaption className="mt-2 text-center text-xs text-fd-muted-foreground">{caption}</figcaption>
    </figure>
  )
}
