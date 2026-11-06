// The welcome window's footer (26px, the status bar's height): version, update status,
// What's new, and a "Sign in" slot on the right.
//
//   Blocksy 0.4.0 · ✓ Up to date · What's new                      [👤 Sign in]
//
// The slot is disabled until accounts arrive (v0.14, see docs/release/releases/v0.14.md).
import { ArrowUpCircle, Check, CircleUser, Download, TriangleAlert } from "lucide-react"
import { useEffect, useState } from "react"
import { getVersion } from "@tauri-apps/api/app"
import { Button, Spinner, toast, Tooltip, TooltipContent, TooltipTrigger } from "@blocksy/ui"
import { errorMessage } from "../../shared/api"
import { useNavigation } from "../../shared/stores/navigation"
import { useUpdates } from "../../shared/stores/updates"

const item = "h-(--b-row-h) gap-1.5 px-2 text-xs font-normal text-fg-muted [&_svg]:size-3.5"

/** The update part: what the updater is doing, and Restart when an update is ready. */
function UpdateStatus() {
  const { state, version, message, install } = useUpdates()
  const restart = async () => {
    try {
      await install()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }
  if (state === "disabled") return <span className="px-2 text-xs text-fg-faint">Updates are off in this build</span>
  if (state === "checking") return <span className="flex items-center gap-1.5 px-2 text-xs text-fg-muted"><Spinner className="size-3" /> Checking for updates</span>
  if (state === "downloading") return <span className="flex items-center gap-1.5 px-2 text-xs text-fg-muted"><Download className="size-3.5" strokeWidth={1.75} /> Downloading {version ?? "update"}</span>
  if (state === "ready")
    return (
      <Button variant="ghost" size="xs" className={item} onClick={() => void restart()}>
        <ArrowUpCircle className="text-brand" strokeWidth={1.75} /> Restart to update to {version}
      </Button>
    )
  if (state === "error")
    return (
      <Tooltip>
        <TooltipTrigger render={<span className="flex items-center gap-1.5 px-2 text-xs text-fg-muted" />}>
          <TriangleAlert className="size-3.5 text-warning" strokeWidth={1.75} /> Couldn't check for updates
        </TooltipTrigger>
        <TooltipContent>{message ?? "Try again later"}</TooltipContent>
      </Tooltip>
    )
  return <span className="flex items-center gap-1.5 px-2 text-xs text-fg-muted"><Check className="size-3.5 text-success" strokeWidth={2} /> Up to date</span>
}

export function WelcomeFooter() {
  const [appVersion, setAppVersion] = useState("")
  const setWhatsNew = useNavigation((s) => s.setWhatsNew)
  useEffect(() => {
    void getVersion().then(setAppVersion).catch(() => {})
  }, [])
  return (
    <footer className="flex h-(--b-statusbar-h) shrink-0 items-center gap-1 px-2">
      <span className="px-2 text-xs text-fg-muted">Blocksy {appVersion}</span>
      <UpdateStatus />
      <Button variant="ghost" size="xs" className={item} onClick={() => setWhatsNew(true)}>
        What's new
      </Button>
      <div className="flex-1" />
      {/* The sign-in slot (v0.14): disabled for now. The wrapper span lets the tooltip show on a disabled button. */}
      <Tooltip>
        <TooltipTrigger render={<span tabIndex={0} className="inline-flex" />}>
          <Button variant="ghost" size="xs" className={item} disabled aria-label="Sign in (arrives in v0.14)">
            <CircleUser strokeWidth={1.75} /> Sign in
          </Button>
        </TooltipTrigger>
        <TooltipContent>Accounts arrive in v0.14</TooltipContent>
      </Tooltip>
    </footer>
  )
}
