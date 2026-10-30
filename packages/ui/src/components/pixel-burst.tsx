// PixelBurst: a tiny celebration: a dozen square "pixels" pop out from the centre of
// whatever it sits in, drift outwards and fade. It plays once when it mounts, so
// render it at the moment something good happens ("Your mod is loaded").
// Custom because shadcn has no celebration effect. Uses motion; skipped entirely
// when the OS asks for reduced motion.
import { motion, useReducedMotion } from "motion/react"

const COLOURS = ["var(--b-brand)", "var(--b-success)", "var(--b-project)", "var(--b-warning)"]
const COUNT = 12

export function PixelBurst() {
  const reduce = useReducedMotion()
  if (reduce) return null
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
      {Array.from({ length: COUNT }, (_, i) => {
        // Spread evenly around a circle, with a little wobble so it feels hand-made.
        const angle = (i / COUNT) * Math.PI * 2 + (i % 2 ? 0.25 : -0.15)
        const distance = 22 + (i % 3) * 9
        return (
          <motion.span
            key={i}
            className="absolute size-[5px] rounded-[1px]"
            style={{ background: COLOURS[i % COLOURS.length] }}
            initial={{ x: 0, y: 0, scale: 0.4, opacity: 1 }}
            animate={{ x: Math.cos(angle) * distance, y: Math.sin(angle) * distance - 6, scale: 1, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: (i % 4) * 0.02 }}
          />
        )
      })}
    </span>
  )
}
