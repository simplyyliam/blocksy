// The app root: providers, the router (app/router.tsx: two layouts with <Outlet>s),
// and the dialogs and toasts that float above every page.
import { MotionConfig } from "motion/react"
import { RouterProvider } from "react-router-dom"
import { Toaster, TooltipProvider } from "@blocksy/ui"
import { NewProjectDialog } from "../features/new-project/new-project-dialog"
import { SettingsDialog } from "../features/settings/settings-dialog"
import { WhatsNewDialog } from "../features/whats-new/whats-new-dialog"
import { router } from "./router"

export function App() {
  return (
    // reducedMotion="user": every motion animation follows the OS "reduce motion" setting.
    <MotionConfig reducedMotion="user">
      <TooltipProvider delay={500}>
        <RouterProvider router={router} />
        <NewProjectDialog />
        <SettingsDialog />
        <WhatsNewDialog />
        <Toaster position="bottom-right" offset={{ right: 20, bottom: 36 }} />
      </TooltipProvider>
    </MotionConfig>
  )
}
