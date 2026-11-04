// "What's new" after an update (redesigned in v0.3): a pixel-art banner with this release's
// own block in the middle (release-art.tsx), then everything that changed, in full, so
// there's no need to leave Blocksy for GitHub.
//
//   ┌───────────────────────────────────┐
//   │ v0.3   ☁      ◇ block ◇     ☁    │
//   │ ▂▃▅▆▅▃▂ pixel hills ▃▅▇▆▅▃▂▂▃▅▆▅ │
//   ├───────────────────────────────────┤
//   │ What's new in Blocksy 0.3.0       │
//   │ One sentence summary.             │
//   │ NEW       • Lead. The full line.  │   <- scrolls when long
//   │ IMPROVED  • ...                   │
//   │ ▸ Good to know (known issues)     │
//   │ [   Got it   ]   Release notes ↗  │
//   └───────────────────────────────────┘
//
// The text comes from CHANGELOG.md, the same section /release writes for GitHub.
import { ChevronRight } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { getVersion } from "@tauri-apps/api/app"
import { openUrl } from "@tauri-apps/plugin-opener"
import { BlurFade, Button, cn, Collapsible, CollapsibleContent, CollapsibleTrigger, Dialog, DialogContent, DialogDescription, DialogTitle } from "@blocksy/ui"
import changelogText from "../../../../../CHANGELOG.md?raw"
import { findRelease, parseChangelog, type ChangelogItem } from "../../shared/changelog"
import { useNavigation } from "../../shared/stores/navigation"
import { ReleaseArt } from "./release-art"

const releases = parseChangelog(changelogText)
const RELEASES_URL = "https://github.com/simplyyliam/blocksy/releases"

/** Changelog sections, shown with friendlier labels and a colour each (theme tokens). */
const SECTIONS = [
  { name: "Added", label: "New", tone: "bg-success/15 text-success" },
  { name: "Changed", label: "Improved", tone: "bg-brand/15 text-brand" },
  { name: "Fixed", label: "Fixed", tone: "bg-warning/15 text-warning" },
]

/** "**Lead.** text" as one line: the lead in the normal colour, the rest muted. */
function Item({ item, index }: { item: ChangelogItem; index: number }) {
  return (
    <BlurFade delay={Math.min(index, 10) * 0.025} offset={3} direction="up">
      <li className="flex gap-2.5 text-sm leading-relaxed text-fg-muted">
        <span className="mt-[0.6em] size-1 shrink-0 rounded-full bg-fg-faint" />
        <span className="min-w-0">
          {item.lead && <span className="text-fg">{item.lead} </span>}
          {item.text}
        </span>
      </li>
    </BlurFade>
  )
}

export function WhatsNewDialog() {
  const open = useNavigation((s) => s.whatsNewOpen)
  const setOpen = useNavigation((s) => s.setWhatsNew)
  const [version, setVersion] = useState("")
  // Focus the text on open, so no focus ring lands on "Got it".
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void getVersion().then(setVersion).catch(() => {})
  }, [])

  const release = findRelease(releases, version)
  if (!release) return null
  const issues = release.sections["Known issues"] ?? []
  let index = 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        initialFocus={bodyRef}
        showCloseButton={false}
        className="flex max-h-[min(86vh,760px)] w-[540px] max-w-[calc(100vw-48px)] flex-col gap-0 overflow-hidden rounded-[24px] p-0 ring-0 sm:max-w-[540px]"
      >
        <div className="shrink-0">
          <ReleaseArt version={release.version} />
        </div>

        <div ref={bodyRef} tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto px-[26px] pt-5 pb-4 outline-none">
          <DialogTitle className="text-xl leading-tight font-normal tracking-[-0.01em] text-fg">What's new in Blocksy {release.version}</DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-relaxed text-fg-muted">{release.summary}</DialogDescription>

          {SECTIONS.map(({ name, label, tone }) => {
            const items = release.sections[name] ?? []
            if (items.length === 0) return null
            return (
              <section key={name} className="mt-5">
                <h3 className="mb-2">
                  <span className={cn("rounded-md px-1.5 py-0.5 text-xs font-medium", tone)}>{label}</span>
                </h3>
                <ul className="flex flex-col gap-1.5">
                  {items.map((item, i) => (
                    <Item key={i} item={item} index={index++} />
                  ))}
                </ul>
              </section>
            )
          })}

          {issues.length > 0 && (
            <Collapsible className="mt-5">
              <CollapsibleTrigger className="group flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
                <ChevronRight className="size-3.5 transition-transform duration-150 group-data-[panel-open]:rotate-90" strokeWidth={2} />
                Good to know ({issues.length})
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {issues.map((item, i) => (
                    <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-fg-muted">
                      <span className="mt-[0.6em] size-1 shrink-0 rounded-full bg-fg-faint" />
                      <span className="min-w-0">
                        {item.lead && <span className="text-fg">{item.lead} </span>}
                        {item.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>

        <div className="grid shrink-0 grid-cols-[43%_1fr] items-center px-[26px] pt-2 pb-[22px]">
          <Button className="h-8 rounded-full bg-fg text-bg hover:bg-fg/85" onClick={() => setOpen(false)}>
            Got it
          </Button>
          <Button
            variant="ghost"
            className="h-8 font-normal text-fg-muted hover:bg-transparent hover:text-fg"
            onClick={() => void openUrl(`${RELEASES_URL}/tag/v${release.version}`)}
          >
            Release notes on GitHub
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
