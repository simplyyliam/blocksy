// Bench mode (pnpm bench, packages/bench). Only runs when the bench runner starts the app with
// BLOCKSY_BENCH set. The app now has two windows (ADR 0020), so the workout has two parts:
//   1. welcome window: records when it is on screen (the cold start), then switches its views and
//      opens New project while timing every frame, saves that, and opens the editor.
//   2. editor window: a scripted workout of the shell (log streaming, Settings), then the 3D preview,
//      merges the welcome window's frames and hands the one report back to Rust.
import { commands } from "../shared/bindings"
import { logLines, useGradle } from "../shared/stores/gradle"
import { useNavigation } from "../shared/stores/navigation"
import { addElement, createDocumentStore, createProject } from "@blocksy/core"
import { previewFrameCount, previewReadyCount } from "@blocksy/model-studio"
import { applyStarter } from "../features/new-project/starters"
import { useEditor } from "../shared/stores/editor"
import { useProject } from "../shared/stores/project"
import { useWelcome } from "../shared/stores/welcome"
import { openEditor, windowKind } from "../shared/windows"
import { blockModule } from "@blocksy/element-block"

const frame = () => new Promise<number>((resolve) => requestAnimationFrame(resolve))
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const percentile = (sorted: number[], p: number) => sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))] ?? 0

/** What the welcome window hands the editor window (windows of one app share localStorage). */
const PARTIAL_KEY = "blocksy.bench-welcome"
interface Partial_ {
  homeAtRustMs: number | null
  homeAtWebviewMs: number
  deltas: number[]
}

/** Records the time between every frame until stopped. */
function recordFrames() {
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
  return { deltas, stop: () => (recording = false) }
}

export async function startBenchIfRequested() {
  if (!(await commands.benchMode())) return
  if (windowKind() === "welcome") await benchWelcome()
  else await benchEditor()
}

/** Part 1: the welcome window. Its paint time is the cold start. */
async function benchWelcome() {
  // Start-up: two frames after the first render means the welcome window is painted.
  await frame()
  await frame()
  const homeAtRustMs = await commands.appUptimeMs()
  const homeAtWebviewMs = performance.now()

  const rec = recordFrames()
  await wait(500)
  const welcome = useWelcome.getState()
  for (const view of ["learn", "community", "settings", "projects"] as const) {
    welcome.setView(view)
    await wait(350)
  }
  welcome.setCreating(true)
  await wait(600)
  welcome.setCreating(false)
  await wait(400)
  rec.stop()

  const partial: Partial_ = { homeAtRustMs, homeAtWebviewMs, deltas: rec.deltas }
  localStorage.setItem(PARTIAL_KEY, JSON.stringify(partial))
  // The editor window skips opening a real project in bench mode (the editor part sets up its own).
  await openEditor("bench://project")
}

/** Part 2: the editor window, then the report for both. */
async function benchEditor() {
  const partial = JSON.parse(localStorage.getItem(PARTIAL_KEY) ?? "null") as Partial_ | null
  localStorage.removeItem(PARTIAL_KEY)
  const homeAtRustMs = partial?.homeAtRustMs ?? null
  const homeAtWebviewMs = partial?.homeAtWebviewMs ?? 0

  // Record every frame while the script runs.
  const rec = recordFrames()
  const deltas = rec.deltas

  // The editor needs a project to show: an in-memory one (nothing on disk), set up in benchBlockPreview.
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
  nav.setSettings(true)
  await wait(500)
  nav.setSettings(false)
  await wait(300)
  nav.setBottomPanel(false)
  await wait(500)
  rec.stop()
  logLines.length = 0

  // 3. 3D (v0.2): open a block in the project editor (an in-memory project, nothing on disk),
  // time until its preview is drawn, then count frames while nobody touches it.
  // Plan section 4: an idle 3D view must render no frames.
  const preview = await benchBlockPreview()

  // 3. Report. Memory of the whole process tree is measured by the runner.
  const sorted = [...(partial?.deltas ?? []), ...deltas].sort((a, b) => a - b)
  const heap = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory
  const report = {
    homeAtRustMs,
    homeAtWebviewMs,
    frames: { count: sorted.length, medianMs: percentile(sorted, 50), p95Ms: percentile(sorted, 95), maxMs: sorted.at(-1) ?? 0 },
    jsHeapMb: heap ? heap.usedJSHeapSize / 1024 / 1024 : null,
    preview,
    userAgent: navigator.userAgent,
    devicePixelRatio: window.devicePixelRatio,
    screen: `${screen.width}x${screen.height}`,
  }
  await commands.benchFinish(JSON.stringify(report))
}

/** Opens a starter project with 20 blocks, shows one block's preview, measures it. */
async function benchBlockPreview() {
  let doc = applyStarter(createProject({ name: "Bench Mod", target: "fabric", minecraftVersion: "26.1.2" }), "block")
  const store = createDocumentStore(doc)
  for (let i = 2; i <= 20; i++) store.execute(addElement({ id: `bench_block_${i}`, type: "block", name: `Bench Block ${i}`, data: blockModule.create(store.get()) }))
  doc = store.get()
  useProject.setState({ current: { dir: "bench://project", doc, documents: store, version: { minecraft: "26.1.2", java: 25, pins: {} }, targetName: "Fabric" } })
  useNavigation.getState().go("project")
  await wait(300)
  const start = performance.now()
  const before = previewReadyCount()
  // v0.4: a block opens in Paint mode; the 3D preview this measures is the Look mode.
  useEditor.getState().setMode("block", "look")
  useEditor.getState().select("first_block")
  // Ready = the preview's first full frame with its texture (the moment the loader hides).
  while (previewReadyCount() === before && performance.now() - start < 10_000) await frame()
  const readyMs = performance.now() - start
  // Switching to another block reuses the canvas: time until its new texture is drawn.
  await wait(500)
  const idleStart = previewFrameCount()
  await wait(2000)
  const idleFrames = previewFrameCount() - idleStart
  useProject.setState({ current: null })
  return { readyMs, idleFrames }
}
