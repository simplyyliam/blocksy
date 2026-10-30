// Bench mode (pnpm bench, packages/bench). Only runs when the bench runner starts the
// app with BLOCKSY_BENCH set. It records when Home is on screen, then runs a scripted
// workout of the shell while timing every frame, and hands the report back to Rust.
import { commands } from "../shared/bindings"
import { logLines, useGradle } from "../shared/stores/gradle"
import { useNavigation, type Page } from "../shared/stores/navigation"
import { addElement, createDocumentStore, createProject } from "@blocksy/core"
import { previewFrameCount } from "@blocksy/model-studio"
import { applyStarter } from "../features/new-project/starters"
import { useEditor } from "../shared/stores/editor"
import { useProject } from "../shared/stores/project"
import { blockModule } from "@blocksy/element-block"

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

  // 3. 3D (v0.2): open a block in the project editor (an in-memory project, nothing on disk),
  // time until its preview is drawn, then count frames while nobody touches it.
  // Plan section 4: an idle 3D view must render no frames.
  const preview = await benchBlockPreview()

  // 3. Report. Memory of the whole process tree is measured by the runner.
  const sorted = [...deltas].sort((a, b) => a - b)
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
  const before = previewFrameCount()
  useEditor.getState().select("first_block")
  // Ready = the preview drew its first frame (frame counter moves).
  while (previewFrameCount() === before && performance.now() - start < 10_000) await frame()
  await frame()
  const readyMs = performance.now() - start
  // Switching to another block reuses the canvas: time until its new texture is drawn.
  await wait(500)
  const idleStart = previewFrameCount()
  await wait(2000)
  const idleFrames = previewFrameCount() - idleStart
  useNavigation.getState().go("home")
  useProject.setState({ current: null })
  return { readyMs, idleFrames }
}
