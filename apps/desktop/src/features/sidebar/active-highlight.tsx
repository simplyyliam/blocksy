// The grey pill behind the active sidebar row. Every row uses the same layoutId, so
// when the active row changes the pill glides from the old row to the new one instead
// of blinking. The row needs `relative isolate` so the pill sits behind its text.
import { motion } from "motion/react"

export const activeRow = "relative isolate data-active:bg-transparent"

export function ActiveHighlight() {
  return (
    <motion.span
      layoutId="sidebar-active"
      aria-hidden
      className="absolute inset-0 -z-10 rounded-[inherit] bg-sidebar-accent"
      transition={{ type: "spring", stiffness: 520, damping: 40 }}
    />
  )
}
