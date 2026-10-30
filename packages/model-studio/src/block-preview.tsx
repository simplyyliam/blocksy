// A live 3D preview of one block, drawn from a CubeModel document.
// Follows the plan's React Three Fiber rules (section 4.2):
// - frameloop="demand": nothing is drawn while nothing changes (idle GPU near zero)
// - dpr capped at 1.5, and dropped to 1 by PerformanceMonitor when frames get slow
// - textures use NearestFilter (crisp pixels) and are disposed when replaced
// - panels stay outside the Canvas; only the cube lives in here
import { ContactShadows, OrbitControls, PerformanceMonitor } from "@react-three/drei"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useState } from "react"
import * as THREE from "three"
import { BOX_FACE_ORDER, FACE_SHADE, faceTexture, type CubeModel } from "./cube-model.ts"

/** Frames drawn by every preview so far. The bench reads it to prove idle = no frames. */
let framesDrawn = 0
export const previewFrameCount = () => framesDrawn

function CountFrames() {
  useFrame(() => {
    framesDrawn++
  })
  return null
}

/** Loads a PNG data URL as a pixel-crisp texture, and frees the old one when it changes. */
function usePixelTexture(url: string | null): THREE.Texture | null {
  const invalidate = useThree((s) => s.invalidate)
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  useEffect(() => {
    if (!url) {
      setTexture(null)
      return
    }
    let alive = true
    let loaded: THREE.Texture | null = null
    new THREE.TextureLoader().load(url, (t) => {
      t.magFilter = THREE.NearestFilter
      t.minFilter = THREE.NearestFilter
      t.generateMipmaps = false
      t.colorSpace = THREE.SRGBColorSpace
      loaded = t
      if (alive) {
        setTexture(t)
        invalidate() // draw one new frame with the new texture
      } else t.dispose()
    })
    return () => {
      alive = false
      loaded?.dispose()
    }
  }, [url, invalidate])
  return texture
}

function Cube({ model, placeholder }: { model: CubeModel; placeholder: string }) {
  // One texture per distinct URL (usually all six faces share one).
  const urls = BOX_FACE_ORDER.map((face) => faceTexture(model, face))
  const textures = [
    usePixelTexture(urls[0]!),
    usePixelTexture(urls[1]!),
    usePixelTexture(urls[2]!),
    usePixelTexture(urls[3]!),
    usePixelTexture(urls[4]!),
    usePixelTexture(urls[5]!),
  ]
  // Unlit materials tinted per face give Minecraft's directional shading for free.
  const materials = useMemo(
    () =>
      BOX_FACE_ORDER.map((face, i) => {
        const shade = FACE_SHADE[face]
        const color = textures[i] ? new THREE.Color(shade, shade, shade) : new THREE.Color(placeholder).multiplyScalar(shade)
        return new THREE.MeshBasicMaterial({ map: textures[i], color, transparent: true, alphaTest: 0.1 })
      }),
    [placeholder, ...textures],
  )
  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials])
  return (
    <mesh material={materials}>
      <boxGeometry args={[1, 1, 1]} />
    </mesh>
  )
}

export interface BlockPreviewProps {
  model: CubeModel
  /** Face colour while there is no texture (pass a theme token value). */
  placeholder?: string
  /** Shadow colour under the block (pass a theme token value). */
  shadow?: string
  className?: string
}

export function BlockPreview({ model, placeholder = "#d4d4d4", shadow = "#000000", className }: BlockPreviewProps) {
  const [dpr, setDpr] = useState(1.5)
  return (
    <Canvas
      className={className}
      frameloop="demand"
      dpr={[1, dpr]}
      orthographic={false}
      camera={{ position: [2.1, 1.7, 2.6], fov: 32 }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} />
      <CountFrames />
      <Cube model={model} placeholder={placeholder} />
      {/* frames={1}: the soft shadow is baked once, not redrawn every frame. */}
      <ContactShadows position={[0, -0.62, 0]} opacity={0.28} scale={3} blur={2.4} far={1.2} frames={1} color={shadow} />
      {/* Drag to turn the block. OrbitControls asks for a frame only while it moves. */}
      <OrbitControls enablePan={false} enableZoom minDistance={2.2} maxDistance={6} enableDamping={false} />
    </Canvas>
  )
}
