// The welcome window's root (ADR 0020): providers, the welcome page, and the dialogs and
// toasts that float above it. No router: the window has four views and a New project flow.
import { MotionConfig } from "motion/react"
import { useEffect } from "react"
import { Toaster, TooltipProvider, toast } from "@blocksy/ui"
import { registerWelcomeCommands } from "../features/welcome/commands"
import { WhatsNewDialog } from "../features/whats-new/whats-new-dialog"
import { useShortcuts } from "../shared/commands/use-shortcuts"
import { takeWelcomeNotice } from "../shared/windows"
import { WelcomePage } from "../pages/welcome/welcome-page"

registerWelcomeCommands()

export function WelcomeApp() {
  useShortcuts()
  // The editor can leave a message here (for example a project that could not open).
  useEffect(() => {
    const notice = takeWelcomeNotice()
    if (notice) toast.error(notice)
  }, [])
  return (
    // reducedMotion="user": every motion animation follows the OS "reduce motion" setting.
    <MotionConfig reducedMotion="user">
      <TooltipProvider delay={500}>
        <WelcomePage />
        <WhatsNewDialog />
        <Toaster position="bottom-right" offset={{ right: 16, bottom: 36 }} />
      </TooltipProvider>
    </MotionConfig>
  )
}
