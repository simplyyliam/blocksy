// @blocksy/model-studio: Model Studio: model document, formats, tools and the R3F viewport.
// Public API of this package. Other packages may import only from here.
// v0.2 ships the first piece: a cube model document and its live block preview.
export { BOX_FACE_ORDER, FACE_SHADE, faceTexture, type CubeModel, type Face } from "./cube-model.ts"
export { BlockPreview } from "./block-preview.tsx"
export type { BlockPreviewProps } from "./block-preview-scene.tsx"
export { previewFrameCount } from "./frame-count.ts"
