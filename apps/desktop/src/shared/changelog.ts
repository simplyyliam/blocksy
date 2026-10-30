// Reads CHANGELOG.md (the same text /release writes and GitHub shows) so the app can
// show "What's new" for a version. Only understands the shape /release produces:
//
//   ## [0.1.1] - 2026-10-31
//   One sentence about the release.
//   ### Added
//   - **Lead.** The rest of the line.

export interface ChangelogItem {
  /** The bold start of an item ("Create a mod in one dialog."), if it has one. */
  lead: string | null
  text: string
}

export interface ChangelogRelease {
  version: string
  date: string
  summary: string
  /** "Added", "Changed", "Fixed", "Known issues", "Privacy" → their items. */
  sections: Record<string, ChangelogItem[]>
}

export function parseChangelog(markdown: string): ChangelogRelease[] {
  const releases: ChangelogRelease[] = []
  let release: ChangelogRelease | null = null
  let section: ChangelogItem[] | null = null

  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw.trim()
    const heading = /^## \[([^\]]+)\]\s*-\s*(\S+)/.exec(line)
    if (heading) {
      release = { version: heading[1]!, date: heading[2]!, summary: "", sections: {} }
      releases.push(release)
      section = null
    } else if (!release) {
      continue // the intro above the first release
    } else if (line.startsWith("### ")) {
      section = release.sections[line.slice(4).trim()] = []
    } else if (line.startsWith("- ") && section) {
      const bold = /^- \*\*(.+?)\*\*\s*(.*)$/.exec(line)
      section.push(bold ? { lead: bold[1]!, text: bold[2]! } : { lead: null, text: line.slice(2) })
    } else if (line && !section && !release.summary) {
      release.summary = line
    }
  }
  return releases
}

/** The release for `version`, or the newest one if that version isn't listed. */
export const findRelease = (releases: ChangelogRelease[], version: string) =>
  releases.find((r) => r.version === version) ?? releases[0] ?? null
