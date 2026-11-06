// The Docs package's light data: lessons, community links and credits. No React, no Fumadocs, so
// importing it is cheap. The Docs app itself is loaded on demand (loadDocsApp in index.ts).
export { CREDITS, DISCLAIMER, FEATURED } from "./credits.ts"
export type { Credit, CreditGroup } from "./credits.ts"
export { LESSONS, lessonPath, type Lesson } from "./lessons.ts"
export { COMMUNITY_ENTRIES, COMMUNITY_TYPES, type CommunityEntry } from "./community-data.ts"
