// The Settings sections (shared by the panel, the editor's dialog and the welcome window).
import { Coffee, Folders, RefreshCw, Settings2, type LucideIcon } from "lucide-react"

// Each section has a coloured icon tile (theme colours, like macOS System Settings),
// so the list is quick to scan.
export const settingsSections = [
  { id: "general", label: "General", Icon: Settings2 as LucideIcon, tile: "bg-fg-muted" },
  { id: "java", label: "Java", Icon: Coffee as LucideIcon, tile: "bg-warning" },
  { id: "projects", label: "Projects", Icon: Folders as LucideIcon, tile: "bg-brand" },
  { id: "updates", label: "Updates", Icon: RefreshCw as LucideIcon, tile: "bg-success" },
] as const
export type SettingsSectionId = (typeof settingsSections)[number]["id"]
