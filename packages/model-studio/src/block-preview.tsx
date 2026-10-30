// BlockPreview, loaded lazily: three.js and React Three Fiber are big, so their code is
// fetched the first time a preview is shown, not at app start (keeps cold start fast).
// Callers show a loader until `onReady` fires (see block-preview-scene.tsx).
import { lazy, Suspense } from "react"
import type { BlockPreviewProps } from "./block-preview-scene.tsx"

const loadScene = () => import("./block-preview-scene.tsx")
const Scene = lazy(() => loadScene().then((m) => ({ default: m.BlockPreview })))

/** Starts fetching the 3D code early (e.g. when a project opens), so the first preview is quick. */
export const preloadBlockPreview = () => void loadScene()

export function BlockPreview(props: BlockPreviewProps) {
  return (
    <Suspense fallback={null}>
      <Scene {...props} />
    </Suspense>
  )
}
