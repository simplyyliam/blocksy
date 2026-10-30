// CanvasLoader: a centred pixel loader over a canvas that is still getting ready
// (3D previews start WebGL and compile shaders the first time). Fades out when
// `ready` turns true. Custom: shadcn has no overlay loader; it reuses PixelLoader.
import { AnimatePresence, motion } from "motion/react"
import { PixelLoader } from "./pixel-loader.tsx"

export function CanvasLoader({ ready, label = "Loading preview" }: { ready: boolean; label?: string }) {
  return (
    <AnimatePresence>
      {!ready && (
        <motion.div
          key="loader"
          className="pointer-events-none absolute inset-0 grid place-items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.08 } }} // within the plan's 100 ms, yet fast loads never flash it
          exit={{ opacity: 0, transition: { duration: 0.18 } }}
        >
          <span className="flex flex-col items-center gap-2.5 text-xs text-fg-muted">
            <PixelLoader className="size-6 text-brand" label={label} />
            {label}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
