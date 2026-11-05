// First-build progress: the first build downloads Gradle, Minecraft and Fabric, which
// takes a few minutes. Shown as a calm timeline (AI Elements' Chain of Thought):
//
//   ■ Setting up My Mod
//   ⌄ Working for 1m 12s
//   ✓ Downloading Gradle
//   ⠿ Setting up Minecraft        ← pixel loader + shimmering label
//     [ > Configure project : ]   ← the latest Gradle line, as a chip
//   • Compiling your mod          ← still to come, faint
import { Check, ChevronDown, Dot, type LucideIcon } from "lucide-react"
import { useEffect, useState } from "react"
import {
  Button, ChainOfThought, ChainOfThoughtContent, ChainOfThoughtSearchResult, ChainOfThoughtSearchResults, ChainOfThoughtStep,
  cn, ElapsedTime, PixelLoader, Progress, Shimmer,
} from "@blocksy/ui"
import { ProjectImage } from "../../shared/project-image"
import { stopTask } from "../../shared/project-actions"
import { FIRST_BUILD_STEPS, logLines, useGradle } from "../../shared/stores/gradle"
import { useNavigation } from "../../shared/stores/navigation"
import { useProject } from "../../shared/stores/project"
import { latestDownload, overallProgress, timeLeft } from "../../shared/vanilla/setup-progress"
import { useWorkspace } from "../../shared/vanilla/workspace"

// Chain of Thought steps take a lucide icon; the pixel loader accepts the same
// className prop, so it can stand in for one on the step that is running now.
const ActiveIcon = (({ className }: { className?: string }) => <PixelLoader className={cn(className, "text-brand")} />) as LucideIcon

/** Seconds since the screen appeared, ticking once a second. */
function useElapsedSeconds() {
  const [start] = useState(() => Date.now())
  const [now, setNow] = useState(start)
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  return Math.floor((now - start) / 1000)
}

export function FirstBuild() {
  // Reads the shared logLines buffer, which changes outside React: opt out of the
  // React Compiler's caching so every logVersion change redraws.
  "use no memo"
  const step = useGradle((s) => s.step)
  const prepares = useGradle((s) => s.prepares)
  useGradle((s) => s.logVersion) // redraw as output arrives
  const name = useProject((s) => s.current?.doc.name ?? "your mod")
  const dir = useProject((s) => s.current?.dir ?? "")
  const openLog = useNavigation((s) => s.setBottomPanel)
  const seconds = useElapsedSeconds()
  const [open, setOpen] = useState(true)
  const lastLine = [...logLines].reverse().find((l) => l.text.trim())?.text.trim() ?? "Starting…"
  const current = Math.max(step, 0)
  const hideSetup = useWorkspace((s) => s.hideSetup)

  // v0.4: how far along the whole setup is, and what is downloading right now.
  const download = latestDownload(logLines.slice(-120).map((l) => l.text))
  const downloading = (current === 0 || current === 2) && download !== null
  const progress = overallProgress(step, downloading && download.percent !== null ? download.percent / 100 : 0, !prepares)
  const left = timeLeft(progress, seconds)

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col px-4 pt-10">
      <div className="flex items-center gap-3">
        <ProjectImage dir={dir} grid={[6, 6]} className="size-6 shrink-0 overflow-hidden rounded-[5px]" />
        <h1 className="min-w-0 text-lg wrap-anywhere text-fg">Setting up {name}</h1>
      </div>

      {/* The whole setup at a glance: a bar, the percentage, the time left, the current download. */}
      <div className="mt-4 flex flex-col gap-1.5">
        <Progress value={Math.round(progress * 100)} aria-label="Setup progress" />
        <div className="flex items-baseline justify-between gap-3 text-xs text-fg-muted">
          <span className="tabular-nums">
            {Math.round(progress * 100)}%{left ? ` · ${left}` : ""}
          </span>
          {downloading && (
            <span className="truncate font-mono" title={download.name}>
              Downloading {download.name}
              {download.doneMb !== null && download.totalMb !== null ? ` · ${download.doneMb} / ${download.totalMb} MB` : download.percent !== null ? ` · ${download.percent}%` : ""}
            </span>
          )}
        </div>
      </div>

      <ChainOfThought open={open} onOpenChange={setOpen} className="mt-5 space-y-3">
        {/* Our own trigger (chevron on the left), so the AI Elements file stays as installed. */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="-ml-3 gap-3 font-normal text-fg-muted hover:bg-transparent"
        >
          <ChevronDown className={cn("transition-transform duration-200 ease-out", !open && "-rotate-90")} strokeWidth={1.75} />
          <span>
            Working for <ElapsedTime seconds={seconds} />
          </span>
        </Button>

        <ChainOfThoughtContent className="space-y-4">
          {FIRST_BUILD_STEPS.map((s, i) => {
            // "Generating block data" only happens in mods that have blocks.
            if ("onlyWhenPreparing" in s && !prepares) return null
            const status = i < current ? "complete" : i === current ? "active" : "pending"
            return (
              <ChainOfThoughtStep
                key={s.id}
                status={status}
                icon={status === "complete" ? Check : status === "active" ? ActiveIcon : Dot}
                label={status === "active" ? <Shimmer as="span">{s.label}</Shimmer> : s.label}
              >
                {status === "active" && (
                  <ChainOfThoughtSearchResults>
                    <ChainOfThoughtSearchResult className="max-w-[440px] font-mono" title={lastLine}>
                      <span className="truncate">{lastLine}</span>
                    </ChainOfThoughtSearchResult>
                  </ChainOfThoughtSearchResults>
                )}
              </ChainOfThoughtStep>
            )
          })}
        </ChainOfThoughtContent>
      </ChainOfThought>

      <p className="mt-8 text-sm text-fg-muted">
        This happens once. It downloads Minecraft and the mod loader to your Gradle cache, and every later project reuses that download. Minecraft's pictures load in the editor when it finishes.
      </p>
      <div className="mt-4 flex gap-1.5">
        <Button size="sm" onClick={hideSetup}>
          Open editor now
        </Button>
        <Button variant="secondary" size="sm" onClick={() => openLog(true)}>
          Show full log
        </Button>
        <Button variant="ghost" size="sm" onClick={() => void stopTask()}>
          Stop
        </Button>
      </div>
    </div>
  )
}
