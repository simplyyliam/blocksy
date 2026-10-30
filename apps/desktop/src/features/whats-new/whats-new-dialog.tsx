// "What's new" after an update, styled after docs/design/b037947d…jpg: a soft blurred
// banner with a frosted Blocksy tile, then the version, a one-line summary, the main
// features, a dark "Got it" pill and a quiet "See all changes" link.
//
//   ┌───────────────────────────────┐
//   │ ░▒▓ blurred banner ▓▒░  1 1 1 │
//   │           [ ▣ ]               │
//   ├───────────────────────────────┤
//   │ What's new in 0.1.1  [Update] │
//   │ One sentence summary.         │
//   │ • Feature · Feature           │
//   │ [  Got it  ]   See all changes │
//   └───────────────────────────────┘
//
// The text comes from CHANGELOG.md, the same section /release writes for GitHub.
import { Box } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { getVersion } from "@tauri-apps/api/app"
import { openUrl } from "@tauri-apps/plugin-opener"
import { Button, Dialog, DialogContent, DialogDescription, DialogTitle, ProjectCover } from "@blocksy/ui"
import changelogText from "../../../../../CHANGELOG.md?raw"
import { findRelease, parseChangelog } from "../../shared/changelog"
import { useNavigation } from "../../shared/stores/navigation"

const releases = parseChangelog(changelogText)
const RELEASES_URL = "https://github.com/simplyyliam/blocksy/releases"

/** Rows of "1"s for the banner's dot-matrix texture. */
const BINARY = Array.from({ length: 14 }, () => "1 ".repeat(48)).join("\n")

function Banner({ seed }: { seed: string }) {
  return (
    <div className="relative h-[210px] overflow-hidden">
      {/* Soft colour: sky at the top, green fields below (theme colours only). */}
      <div
        className="absolute inset-0"
        style={{
          background:
            // Sky: a bright blue band across the top.
            "linear-gradient(to bottom, color-mix(in oklch, var(--b-brand), var(--b-white) 35%) 0%, color-mix(in oklch, var(--b-brand), var(--b-white) 55%) 22%, transparent 58%)," +
            // Fields: fresh green in the middle, a touch of yellow, deeper green bottom right.
            "radial-gradient(70% 60% at 25% 75%, color-mix(in oklch, var(--b-success), var(--b-warning) 40%) 0%, transparent 70%)," +
            "radial-gradient(80% 80% at 95% 100%, color-mix(in oklch, var(--b-success), var(--b-fg) 30%) 0%, transparent 65%)," +
            "color-mix(in oklch, var(--b-success), var(--b-white) 15%)",
        }}
      />
      {/* The generated pixel art, blurred into soft blobs: a little different each version. */}
      <ProjectCover seed={seed} className="absolute inset-0 h-full w-full scale-125 opacity-45 blur-2xl mix-blend-soft-light" />
      {/* Film grain. */}
      <svg aria-hidden className="absolute inset-0 h-full w-full opacity-25 mix-blend-overlay">
        <filter id="whats-new-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#whats-new-grain)" />
      </svg>
      {/* Dot-matrix "1 1 1" texture that only shows near the top and right edges. */}
      <pre
        aria-hidden
        className="absolute -top-0.5 -right-2 m-0 font-mono text-[7px] leading-[9px] text-white/45 select-none"
        style={{
          maskImage: "linear-gradient(to bottom, black, transparent 28%), linear-gradient(to left, black, transparent 14%)",
          maskComposite: "add",
        }}
      >
        {BINARY}
      </pre>
      {/* The frosted Blocksy tile. */}
      <div className="absolute inset-0 grid place-items-center">
        <div className="grid size-[104px] place-items-center rounded-[26px] bg-white/20 shadow-[0_8px_24px_-8px_rgb(0_0_0/0.25),inset_0_1px_0_rgb(255_255_255/0.5)] ring-1 ring-white/45 backdrop-blur-md">
          <Box className="size-12 text-white drop-shadow-sm" strokeWidth={2} />
        </div>
      </div>
    </div>
  )
}

export function WhatsNewDialog() {
  const open = useNavigation((s) => s.whatsNewOpen)
  const setOpen = useNavigation((s) => s.setWhatsNew)
  const [version, setVersion] = useState("")
  // Focus the text on open, so no focus ring lands on "Got it" (as in the reference).
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void getVersion().then(setVersion).catch(() => {})
  }, [])

  const release = findRelease(releases, version)
  if (!release) return null
  // The headline features: what was added, changed or fixed (not known issues or privacy).
  const items = ["Added", "Changed", "Fixed"].flatMap((name) => release.sections[name] ?? []).slice(0, 4)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        initialFocus={bodyRef}
        showCloseButton={false}
        className="w-[480px] max-w-[calc(100vw-48px)] gap-0 overflow-hidden rounded-[28px] p-0 ring-0 sm:max-w-[480px]"
      >
        <Banner seed={`blocksy-${release.version}`} />

        <div ref={bodyRef} tabIndex={-1} className="px-[26px] pt-6 pb-[26px] outline-none">
          <div className="flex items-center gap-2.5">
            <DialogTitle className="text-xl leading-tight font-normal tracking-[-0.01em] text-fg">
              What's new in Blocksy {release.version}
            </DialogTitle>
            <span className="rounded-md bg-danger/10 px-1.5 py-0.5 text-xs font-medium text-danger">Update</span>
          </div>
          <DialogDescription className="mt-2.5 text-sm leading-relaxed text-fg-muted">{release.summary}</DialogDescription>

          {items.length > 0 && (
            <ul className="mt-3.5 flex flex-col gap-1.5">
              {items.map((item, i) => (
                <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-fg-muted">
                  <span className="mt-[0.6em] size-1 shrink-0 rounded-full bg-fg-faint" />
                  <span className="min-w-0">
                    {/* Just the bold lead ("Build, Run and Export"); the full line is on GitHub. */}
                    {item.lead ? <span className="text-fg">{item.lead.replace(/\.$/, "")}</span> : item.text}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 grid grid-cols-[43%_1fr] items-center">
            <Button className="h-8 rounded-full bg-fg text-bg hover:bg-fg/85" onClick={() => setOpen(false)}>
              Got it
            </Button>
            <Button
              variant="ghost"
              className="h-8 font-normal text-fg hover:bg-transparent hover:text-fg-muted"
              onClick={() => void openUrl(`${RELEASES_URL}/tag/v${release.version}`)}
            >
              See all changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
