// Frames drawn by every block preview so far. The bench reads it to prove that an
// idle 3D view draws nothing (plan section 4: "no frames rendered when nothing changes").
// Kept apart from the scene so reading it never loads three.js.
let framesDrawn = 0
export const countFrame = () => {
  framesDrawn++
}
export const previewFrameCount = () => framesDrawn

/** Previews that finished their first full frame (textures loaded): the same signal as onReady. */
let readyCount = 0
export const countReady = () => {
  readyCount++
}
export const previewReadyCount = () => readyCount
