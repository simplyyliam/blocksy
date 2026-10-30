// Bench mode (pnpm bench, packages/bench). Only runs when the bench runner starts the
// app with BLOCKSY_BENCH set. It records when Home is on screen, then runs a scripted
// workout of the shell while timing every frame, and hands the report back to Rust.
import { commands } from "../shared/bindings"
import { logLines, useGradle } from "../shared/stores/gradle"
import { useNavigation, type Page } from "../shared/stores/navigation"

const frame = () => new Promise<number>((resolve) => requestAnimationFrame(resolve))
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const percentile = (sorted: number[], p: number) => sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))] ?? 0

export async function startBenchIfRequested() {
  if (!(await commands.benchMode())) return

  // 1. Start-up: two frames after the first render means Home is painted.
  await frame()
  await frame()
  const homeAtRustMs = await commands.appUptimeMs()
  const homeAtWebviewMs = performance.now()

  // 2. Record every frame while the script runs.
  const deltas: number[] = []
  let recording = true
  void (async () => {
    let last = await frame()
    while (recording) {
      const now = await frame()
      deltas.push(now - last)
      last = now
    }
  })()

  const nav = useNavigation.getState()
  await wait(500)
  nav.setBottomPanel(true)
  await wait(400)
  // Stream 5,000 log lines in bursts, like a busy Gradle build.
  for (let burst = 0; burst < 50; burst++) {
    for (let i = 0; i < 100; i++) logLines.push({ text: `> Task :bench line ${burst * 100 + i} ${"·".repeat(i % 40)}`, error: false })
    useGradle.setState((s) => ({ logVersion: s.logVersion + 1 }))
    await frame()
  }
  await wait(300)
  nav.setNewProject(true)
  await wait(600)
  nav.setNewProject(false)
  await wait(400)
  for (const page of ["docs", "home"] satisfies Page[]) {
    nav.go(page)
    await wait(350)
  }
  nav.setSettings(true)
  await wait(500)
  nav.setSettings(false)
  await wait(300)
  nav.setBottomPanel(false)
  await wait(500)
  recording = false
  logLines.length = 0

  // 3. Report. Memory of the whole process tree is measured by the runner.
  const sorted = [...deltas].sort((a, b) => a - b)
  const heap = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory
  const report = {
    homeAtRustMs,
    homeAtWebviewMs,
    frames: { count: sorted.length, medianMs: percentile(sorted, 50), p95Ms: percentile(sorted, 95), maxMs: sorted.at(-1) ?? 0 },
    jsHeapMb: heap ? heap.usedJSHeapSize / 1024 / 1024 : null,
    userAgent: navigator.userAgent,
    devicePixelRatio: window.devicePixelRatio,
    screen: `${screen.width}x${screen.height}`,
  }
  await commands.benchFinish(JSON.stringify(report))
}
