// The curated community links (community.json), typed for the app. Every entry credits its creator.
import community from "./community.json"

export interface CommunityEntry {
  title: string
  url: string
  creator: string
  type: string
  loaders: string[]
  minecraft: string[]
  lastChecked: string
}

export const COMMUNITY_ENTRIES: CommunityEntry[] = community.entries

/** The kinds of link, in the order they are shown, with their heading. */
export const COMMUNITY_TYPES: Record<string, string> = { docs: "Official docs", video: "Video guides", tool: "Tools", reference: "Reference" }
