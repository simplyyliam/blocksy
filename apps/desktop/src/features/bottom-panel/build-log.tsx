// The Build log: live Gradle and game output.
// Lines are drawn in chunks of 200; finished chunks never redraw, so even a
// 20,000-line log stays smooth. It sticks to the bottom unless you scroll up.
import { memo, useLayoutEffect, useRef } from "react"
import { cn } from "@blocksy/ui"
import { logLines, useGradle, type LogLine } from "../../shared/stores/gradle"
import { useProject } from "../../shared/stores/project"

const CHUNK = 200

function tone(line: LogLine, modId: string | undefined) {
  if (/BUILD SUCCESSFUL/.test(line.text)) return "text-success"
  if (/BUILD FAILED|FAILURE:|error:|Exception/.test(line.text)) return "text-danger"
  if (modId && new RegExp(`^\\s*-\\s+${modId}\\s`).test(line.text)) return "text-brand"
  if (line.text.startsWith("> Task")) return "text-fg-muted"
  return undefined
}

// `version` only changes for the last chunk, so memo() skips all the others.
const Chunk = memo(function Chunk({ index, modId }: { index: number; version: number; modId?: string }) {
  const lines = logLines.slice(index * CHUNK, (index + 1) * CHUNK)
  return (
    <div>
      {lines.map((line, i) => (
        <div key={i} className={cn("min-h-[1.5em] whitespace-pre-wrap break-all", tone(line, modId))}>
          {line.text}
        </div>
      ))}
    </div>
  )
})

export function BuildLog() {
  const version = useGradle((s) => s.logVersion)
  const task = useGradle((s) => s.task)
  const modId = useProject((s) => s.current?.doc.modId)
  const box = useRef<HTMLDivElement>(null)
  const stickToBottom = useRef(true)
  const chunks = Math.ceil(logLines.length / CHUNK)

  useLayoutEffect(() => {
    const el = box.current
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight
  }, [version])

  return (
    <div
      ref={box}
      data-selectable
      onScroll={(e) => {
        const el = e.currentTarget
        stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24
      }}
      className="h-full overflow-auto px-4 py-3 font-mono text-sm leading-[1.5] text-fg"
    >
      {chunks === 0 ? (
        <p className="font-sans text-base text-fg-muted">
          {task ? "Waiting for Gradle…" : "Build or Run the mod to see its output here."}
        </p>
      ) : (
        Array.from({ length: chunks }, (_, i) => (
          <Chunk key={i} index={i} version={i === chunks - 1 ? version : 0} modId={modId} />
        ))
      )}
    </div>
  )
}
