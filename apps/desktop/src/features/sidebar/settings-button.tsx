// The settings gear in the bottom-left corner (where the GitHub account will sit later).
import { Settings } from "lucide-react"
import { useNavigation } from "../../shared/stores/navigation"
import { cn } from "@blocksy/ui"

export function SettingsButton() {
  const active = useNavigation((s) => s.page === "settings")
  const go = useNavigation((s) => s.go)
  return (
    <button
      type="button"
      onClick={() => go("settings")}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-7 items-center gap-2 rounded-md px-2 text-base text-fg-muted outline-none transition-colors duration-150",
        "hover:bg-surface hover:text-fg focus-visible:shadow-[0_0_0_3px_var(--b-focus)]",
        active && "bg-surface text-fg",
      )}
    >
      <Settings className="size-3.5" strokeWidth={1.75} />
      Settings
    </button>
  )
}
