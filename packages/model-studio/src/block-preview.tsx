// BlockPreview, loaded lazily: three.js and React Three Fiber are big, so their code is
// fetched the first time a preview is shown, not at app start (keeps cold start fast).
// Callers show a loader until `onReady` fires (see block-preview-scene.tsx).
import { lazy, Suspense } from "react"
import type { BlockPreviewProps } from "./block-preview-scene.tsx"

const Scene = lazy(() => import("./block-preview-scene.tsx").then((m) => ({ default: m.BlockPreview })))

export function BlockPreview(props: BlockPreviewProps) {
  return (
    <Suspense fallback={null}>
      <Scene {...props} />
    </Suspense>
  )
}
