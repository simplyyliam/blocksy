// The welcome Projects list rules, as pure functions (tested): search, grouping, and the
// wording for "last opened". Nothing here touches React or the disk.
import { baseName } from "../../shared/paths"
import type { RecentProject } from "../../shared/stores/recent"

/**
 * Projects matching the search. Every word must appear in the name, the folder name (the mod ID)
 * or the path, in any order and any case, so "berry fab" finds "Berry Mod" in `.../berry_mod`.
 */
export function filterProjects(projects: RecentProject[], query: string): RecentProject[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return projects
  return projects.filter((p) => {
    const haystack = `${p.name} ${baseName(p.dir)} ${p.dir} ${p.target} ${p.minecraftVersion}`.toLowerCase()
    return words.every((w) => haystack.includes(w))
  })
}

/** Pinned projects first, then the rest, each newest first (the store already keeps newest first). */
export function groupProjects(projects: RecentProject[]): { pinned: RecentProject[]; recent: RecentProject[] } {
  return { pinned: projects.filter((p) => p.pinned), recent: projects.filter((p) => !p.pinned) }
}

/** The order the list shows (pinned group, then recent group): arrows and Enter walk this. */
export const displayOrder = (projects: RecentProject[]): RecentProject[] => {
  const { pinned, recent } = groupProjects(projects)
  return [...pinned, ...recent]
}

/** "just now", "5 min ago", "3 h ago", "yesterday", "12 days ago", "3 weeks ago", "2 months ago". */
export function ago(time: number, now = Date.now()): string {
  const minutes = Math.round((now - time) / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  if (days === 1) return "yesterday"
  if (days < 14) return `${days} days ago`
  if (days < 60) return `${Math.round(days / 7)} weeks ago`
  return `${Math.round(days / 30)} months ago`
}

/** Where the next selection goes for an arrow key (clamped, no wrap, like JetBrains). */
export function moveSelection(count: number, current: number, key: "ArrowUp" | "ArrowDown" | "Home" | "End"): number {
  if (count === 0) return -1
  if (key === "Home") return 0
  if (key === "End") return count - 1
  if (current < 0) return key === "ArrowDown" ? 0 : count - 1
  return Math.min(count - 1, Math.max(0, current + (key === "ArrowDown" ? 1 : -1)))
}
