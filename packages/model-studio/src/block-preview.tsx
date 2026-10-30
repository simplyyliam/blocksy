// BlockPreview, loaded lazily: three.js and React Three Fiber are big, so their code is
// fetched the first time a preview is shown, not at app start (keeps cold start fast).
// Callers show a loader until `onReady` fires (see block-preview-scene.tsx).
import { lazy, Suspense } from "react"
import type { BlockPreviewProps } from "./block-preview-scene.tsx"

const loadScene = () => import("./block-preview-scene.tsx")
const Scene = lazy(() => loadScene().then((m) => ({ default: m.BlockPreview })))

/**
 * Gets the first preview ready ahead of time: fetches the 3D code, and wakes up the GPU
 * process by creating (and at once releasing) a tiny WebGL context. The first context in a
 * window is the slow one on integrated graphics; later ones start quickly.
 */
export function preloadBlockPreview() {
  void loadScene()
  const gl = document.createElement("canvas").getContext("webgl2")
  gl?.getExtension("WEBGL_lose_context")?.loseContext()
}

export function BlockPreview(props: BlockPreviewProps) {
  return (
    <Suspense fallback={null}>
      <Scene {...props} />
    </Suspense>
  )
}
