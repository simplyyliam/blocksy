// A live 3D preview of one block, drawn from a CubeModel document.
// Follows the plan's React Three Fiber rules (section 4.2):
// - frameloop="demand": nothing is drawn while nothing changes (idle GPU near zero)
// - dpr capped at 1.5, and dropped to 1 by PerformanceMonitor when frames get slow
// - textures use NearestFilter (crisp pixels) and are disposed when replaced
// - panels stay outside the Canvas; only the cube lives in here
import { OrbitControls, PerformanceMonitor } from "@react-three/drei"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef, useState } from "react"
import * as THREE from "three"
import { countFrame, countReady } from "./frame-count.ts"
import { BOX_FACE_ORDER, FACE_SHADE, faceTexture, type CubeModel } from "./cube-model.ts"

function CountFrames() {
  useFrame(countFrame)
  return null
}

/**
 * Loads each distinct PNG data URL once as a pixel-crisp texture (six faces usually share
 * one), and frees textures that are no longer used. Returns url -> texture.
 */
function usePixelTextures(urls: (string | null)[]): Map<string, THREE.Texture> {
  const invalidate = useThree((s) => s.invalidate)
  const [textures, setTextures] = useState(() => new Map<string, THREE.Texture>())
  // One string for "which textures", so the effect only reruns when the set of URLs changes.
  const key = [...new Set(urls.filter((u): u is string => !!u))].sort().join(" ")
  useEffect(() => {
    const wanted = key ? key.split(" ") : []
    let alive = true
    const loaded = new Map<string, THREE.Texture>()
    let pending = wanted.length
    if (pending === 0) setTextures(new Map())
    for (const url of wanted) {
      new THREE.TextureLoader().load(url, (t) => {
        t.magFilter = THREE.NearestFilter
        t.minFilter = THREE.NearestFilter
        t.generateMipmaps = false
        t.colorSpace = THREE.SRGBColorSpace
        loaded.set(url, t)
        if (!alive) return t.dispose()
        if (--pending === 0) {
          setTextures(new Map(loaded))
          invalidate() // draw one new frame with the new textures
        }
      })
    }
    return () => {
      alive = false
      loaded.forEach((t) => t.dispose())
    }
  }, [key, invalidate])
  return textures
}

/**
 * A soft round shadow under the block: one plane with a radial-gradient texture drawn
 * once on a small canvas. Much cheaper to start than a real-time shadow pass.
 */
function Shadow({ color }: { color: string }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = canvas.height = 64
    const ctx = canvas.getContext("2d")!
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    gradient.addColorStop(0, "rgba(255,255,255,0.55)")
    gradient.addColorStop(1, "rgba(255,255,255,0)")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 64, 64)
    return new THREE.CanvasTexture(canvas)
  }, [])
  useEffect(() => () => texture.dispose(), [texture])
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.56, 0]}>
      <planeGeometry args={[1.9, 1.9]} />
      <meshBasicMaterial map={texture} color={color} transparent depthWrite={false} />
    </mesh>
  )
}

function Cube({ model, placeholder, onReady }: { model: CubeModel; placeholder: string; onReady?: () => void }) {
  const urls = BOX_FACE_ORDER.map((face) => faceTexture(model, face))
  const byUrl = usePixelTextures(urls)
  const textures = urls.map((url) => (url ? (byUrl.get(url) ?? null) : null))
  // Unlit materials tinted per face give Minecraft's directional shading for free.
  const materials = useMemo(
    () =>
      BOX_FACE_ORDER.map((face, i) => {
        const shade = FACE_SHADE[face]
        const color = textures[i] ? new THREE.Color(shade, shade, shade) : new THREE.Color(placeholder).multiplyScalar(shade)
        return new THREE.MeshBasicMaterial({ map: textures[i], color, transparent: true, alphaTest: 0.1 })
      }),
    // textures change exactly when byUrl (or the urls) do
    [placeholder, byUrl, ...urls],
  )
  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials])

  // "Ready" = the first frame drawn with every texture loaded. The editor shows a
  // loader until then (starting WebGL and compiling shaders takes a moment).
  const loaded = urls.every((url, i) => !url || textures[i])
  const signaled = useRef(false)
  const invalidate = useThree((s) => s.invalidate)
  // Redraw when the canvas changes size (panels opening, window resizing): with render on
  // demand nothing else would, and the old frame would show stretched.
  const size = useThree((s) => s.size)
  useEffect(() => {
    if (loaded) invalidate()
  }, [loaded, invalidate, size.width, size.height])
  useFrame(() => {
    if (!loaded || signaled.current) return
    signaled.current = true
    requestAnimationFrame(() => {
      countReady()
      onReady?.()
    }) // after this frame is on screen
  })

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
  /** Called once, when the first frame with all textures is on screen. */
  onReady?: () => void
  /** How close the camera starts: 1 = editor framing, 2 = twice as big (small demos). */
  zoom?: number
}

export function BlockPreview({ model, placeholder = "#d4d4d4", shadow = "#000000", className, onReady, zoom = 1 }: BlockPreviewProps) {
  const [dpr, setDpr] = useState(1.5)
  return (
    <Canvas
      className={className}
      frameloop="demand"
      dpr={[1, dpr]}
      orthographic={false}
      camera={{ position: [7.2 / zoom, 5.8 / zoom, 9.1 / zoom], fov: 22 }}
      // No multisampling: pixel art doesn't need it and the WebGL context starts faster without it.
      gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
    >
      {/* Only ever lowers the pixel ratio (and gives up after 3 changes): raising it again
          would resize the canvas, draw, measure, and could keep an idle preview drawing. */}
      <PerformanceMonitor flipflops={3} onDecline={() => setDpr(1)} onFallback={() => setDpr(1)} />
      <CountFrames />
      <Cube model={model} placeholder={placeholder} onReady={onReady} />
      <Shadow color={shadow} />
      {/* Drag to turn the block. OrbitControls asks for a frame only while it moves. */}
      <OrbitControls enablePan={false} enableZoom minDistance={6 / zoom} maxDistance={20 / zoom} enableDamping={false} />
    </Canvas>
  )
}
