// The first time a project's mod shows up in Minecraft, a short burst of square
// "pixel" confetti (Magic UI Confetti) in the theme's colours. Once per project; it
// respects the OS "reduce motion" setting. Not a status view: game-view renders it.
import { createPortal } from "react-dom"
import { Confetti, useThemeToken } from "@blocksy/ui"

export function Celebration() {
  const colors = [useThemeToken("brand"), useThemeToken("success"), useThemeToken("warning"), useThemeToken("project")]
  return createPortal(
    <Confetti
      className="pointer-events-none fixed inset-0 z-50 size-full"
      options={{ particleCount: 90, spread: 80, startVelocity: 38, ticks: 140, shapes: ["square"], scalar: 1.1, colors, origin: { x: 0.15, y: 1 }, disableForReducedMotion: true }}
    />,
    document.body,
  )
}
