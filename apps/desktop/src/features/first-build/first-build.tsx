// First-build progress: the first build downloads Gradle, Minecraft and Fabric,
// which takes a few minutes. Steps tick off as real Gradle output reaches them,
// and the latest output line shows underneath, so it never looks stuck.
import { Check } from "lucide-react"
import { useEffect, useState } from "react"
import { Button, cn, Progress, Spinner } from "@blocksy/ui"
import { stopTask } from "../../shared/project-actions"
import { FIRST_BUILD_STEPS, logLines, useGradle } from "../../shared/stores/gradle"
import { useNavigation } from "../../shared/stores/navigation"

function useElapsed() {
  const [start] = useState(() => Date.now())
  const [now, setNow] = useState(start)
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  const seconds = Math.floor((now - start) / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
}

export function FirstBuild() {
  const step = useGradle((s) => s.step)
  useGradle((s) => s.logVersion) // redraw as output arrives
  const openLog = useNavigation((s) => s.setBottomPanel)
  const elapsed = useElapsed()
  const lastLine = [...logLines].reverse().find((l) => l.text.trim())?.text ?? "Starting…"

  return (
    <div className="flex w-full max-w-[460px] flex-col pt-[10vh]">
      <h1 className="text-xl font-medium text-fg">Setting up your mod</h1>
      <p className="mt-2 text-base text-fg-muted">
        The first build downloads Minecraft and the mod loader. It takes a few minutes, and only happens once.
      </p>

      <Progress className="mt-8" value={((step + 1) / (FIRST_BUILD_STEPS.length + 1)) * 100} />

      <ol className="mt-6 flex flex-col gap-3">
        {FIRST_BUILD_STEPS.map((s, i) => {
          const done = i < step
          const current = i === step || (step === -1 && i === 0)
          return (
            <li key={s.id} className={cn("flex h-6 items-center gap-3 text-base transition-colors duration-300", done || current ? "text-fg" : "text-fg-faint")}>
              <span className="grid size-5 place-items-center">
                {done ? <Check className="size-3.5 text-success" strokeWidth={2.25} /> : current ? <Spinner className="text-brand" /> : <span className="size-1.5 rounded-full bg-current" />}
              </span>
              {s.label}
            </li>
          )
        })}
      </ol>

      <p className="mt-8 truncate font-mono text-sm text-fg-muted" title={lastLine}>
        {lastLine}
      </p>

      <div className="mt-6 flex items-center justify-between">
        <span className="text-base text-fg-muted tabular-nums">{elapsed}</span>
        <div className="flex gap-1">
          <Button onClick={() => openLog(true)}>Show full log</Button>
          <Button onClick={() => void stopTask()}>Stop</Button>
        </div>
      </div>
    </div>
  )
}
