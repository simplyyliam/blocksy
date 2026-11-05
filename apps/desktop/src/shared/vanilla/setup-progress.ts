// Turns Gradle's output during the first setup into something people can follow:
// what is downloading, how far along it is, how much of the whole setup is done, and roughly
// how long is left. Pure functions over text and numbers, so they are easy to test.

export interface DownloadInfo {
  /** "gradle-9.8.2-bin.zip", "client.jar", ... */
  name: string
  /** 0..100 when Gradle printed a percentage. */
  percent: number | null
  /** Megabytes done and total when printed ("38 / 71 MB"). */
  doneMb: number | null
  totalMb: number | null
}

const URL_LINE = /Downloading\s+(\S+)/i
const PERCENT = /(\d{1,3})%/g
const MB = /(\d+(?:\.\d+)?)\s*(?:MB)?\s*\/\s*(\d+(?:\.\d+)?)\s*MB/i

/** Reads the newest download from the log lines (most recent last). Null when none is going. */
export function latestDownload(lines: string[]): DownloadInfo | null {
  let current: DownloadInfo | null = null
  for (const text of lines) {
    const named = URL_LINE.exec(text)
    if (named) {
      const raw = named[1]!.replace(/[.…]+$/, "")
      current = { name: raw.slice(raw.lastIndexOf("/") + 1) || raw, percent: null, doneMb: null, totalMb: null }
      continue
    }
    if (!current) continue
    const percents = [...text.matchAll(PERCENT)].map((m) => Number(m[1])).filter((n) => n <= 100)
    if (percents.length) current = { ...current, percent: percents[percents.length - 1]! }
    const mb = MB.exec(text)
    if (mb) current = { ...current, doneMb: Number(mb[1]), totalMb: Number(mb[2]) }
  }
  return current
}

/** Weights of the first-build steps (gradle.ts FIRST_BUILD_STEPS order), roughly their share of the time. */
export const STEP_WEIGHTS = [12, 3, 55, 15, 10, 5]

/**
 * How much of the whole setup is done, 0..1. `step` is the step Gradle is on, `stepFraction`
 * how far through that step (when a download percentage is known), `skipDatagen` drops the
 * data-generation step for mods without blocks.
 */
export function overallProgress(step: number, stepFraction: number, skipDatagen: boolean): number {
  const weights = STEP_WEIGHTS.map((w, i) => (skipDatagen && i === 4 ? 0 : w))
  const total = weights.reduce((a, b) => a + b, 0)
  if (step < 0) return 0
  const done = weights.slice(0, step).reduce((a, b) => a + b, 0)
  const now = (weights[step] ?? 0) * Math.min(1, Math.max(0, stepFraction))
  return Math.min(1, (done + now) / total)
}

/** "about 2 min left", from how far along we are and how long it has taken. Null while unsure. */
export function timeLeft(progress: number, elapsedSeconds: number): string | null {
  if (progress < 0.08 || elapsedSeconds < 20) return null
  const left = (elapsedSeconds * (1 - progress)) / progress
  if (left < 45) return "less than a minute left"
  const minutes = Math.round(left / 60)
  return `about ${minutes} min left`
}
