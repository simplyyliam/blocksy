import { describe, expect, it } from "vitest"
import realChangelog from "../../../../CHANGELOG.md?raw"
import { findRelease, parseChangelog } from "./changelog"

const sample = `# Changelog

Intro text.

## [0.1.1] - 2026-10-31

A small update.

### Added

- **What's new.** A dialog after each update.
- Plain item without a lead.

### Known issues

- Something odd.

## [0.1.0] - 2026-10-30

The first Blocksy.
`

describe("parseChangelog", () => {
  it("reads versions, summaries and items with or without a bold lead", () => {
    const [latest, first] = parseChangelog(sample)
    expect(latest).toEqual({
      version: "0.1.1",
      date: "2026-10-31",
      summary: "A small update.",
      sections: {
        Added: [
          { lead: "What's new.", text: "A dialog after each update." },
          { lead: null, text: "Plain item without a lead." },
        ],
        "Known issues": [{ lead: null, text: "Something odd." }],
      },
    })
    expect(first?.summary).toBe("The first Blocksy.")
  })

  it("falls back to the newest release for an unknown version", () => {
    const releases = parseChangelog(sample)
    expect(findRelease(releases, "0.1.0")?.version).toBe("0.1.0")
    expect(findRelease(releases, "9.9.9")?.version).toBe("0.1.1")
    expect(findRelease([], "0.1.0")).toBeNull()
  })

  it("parses the real CHANGELOG.md", () => {
    const real = parseChangelog(realChangelog)
    expect(real[0]?.sections.Added?.length).toBeGreaterThan(0)
  })
})
