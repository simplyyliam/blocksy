// `pnpm bench`: measures the real Blocksy app against the performance budget (plan section 4)
// and writes the results to docs/perf/<version>.md.
//
//   1. Build a release binary if it is missing or older than the sources.
//   2. Launch it RUNS times with BLOCKSY_BENCH=<report file>. The app then times Home,
//      runs a scripted workout (apps/desktop/src/app/bench.ts), writes a JSON report and quits.
//   3. While it runs, sample the memory of blocksy.exe and its WebView2 children; keep the peak.
//   4. Write a Markdown table: medians of all runs, with pass/fail against the budget.
//
// Windows only for now (process memory comes from PowerShell / CIM).
import { execFileSync, spawn } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const RUNS = Number(process.env.BENCH_RUNS ?? 5)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..")
const desktop = path.join(root, "apps/desktop")
const exe = path.join(desktop, "src-tauri/target/release/blocksy.exe")
// BENCH_VERSION=0.2.0 records a release before its version bump (the /release step bumps it).
const version = process.env.BENCH_VERSION || JSON.parse(fs.readFileSync(path.join(desktop, "src-tauri/tauri.conf.json"), "utf8")).version
const minor = version.split(".").slice(0, 2).join(".")

// The budget from plan section 4 that the app can measure so far.
// v0.2 adds the block preview: idle 3D views must draw no frames (plan section 4), and the
// first preview should be on screen within 1 s (a pixel loader shows within 100 ms).
const BUDGET = { coldStartMs: 2500, memoryMb: 600, frameP95Ms: 1000 / 30, idleFrames: 0, previewReadyMs: 1000 }

/** Newest modification time of any file under these folders (skips build output). */
function newestMtime(dirs) {
  let newest = 0
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (["node_modules", "target", "dist", "gen", "bench"].includes(entry.name)) continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else newest = Math.max(newest, fs.statSync(full).mtimeMs)
    }
  }
  for (const dir of dirs) if (fs.existsSync(dir)) walk(dir)
  return newest
}

function buildIfStale() {
  const sources = [path.join(desktop, "src"), path.join(desktop, "src-tauri/src"), path.join(root, "packages")]
  const stale = !fs.existsSync(exe) || newestMtime(sources) > fs.statSync(exe).mtimeMs
  if (!stale) return console.log("Release build is up to date.")
  console.log("Building a release binary (this takes a few minutes)…")
  execFileSync("pnpm --filter @blocksy/desktop tauri build --no-bundle", { cwd: root, stdio: "inherit", shell: true })
}

/**
 * Private working set (MB) of a process and all its descendants (WebView2 lives there).
 * "Private" is what Task Manager shows as Memory: pages that belong only to that process.
 * The plain working set also counts shared DLL pages once per process, which over-counts
 * a multi-process app like this one several times over.
 */
function treeMemoryMb(pid) {
  const script =
    "Get-CimInstance Win32_PerfFormattedData_PerfProc_Process | Select-Object IDProcess,CreatingProcessID,WorkingSetPrivate | ConvertTo-Json -Compress"
  const all = JSON.parse(execFileSync("powershell", ["-NoProfile", "-Command", script], { encoding: "utf8" })).filter((p) => p.IDProcess > 0)
  const children = new Map()
  for (const p of all) children.set(p.CreatingProcessID, [...(children.get(p.CreatingProcessID) ?? []), p])
  let bytes = 0
  const stack = all.filter((p) => p.IDProcess === pid)
  while (stack.length) {
    const p = stack.pop()
    bytes += Number(p.WorkingSetPrivate)
    stack.push(...(children.get(p.IDProcess) ?? []))
  }
  return bytes / 1024 / 1024
}

/** Temporary WebView2 folders to delete once all runs are done. */
const leftovers = []

/** Best-effort cleanup: a folder still locked by a closing WebView2 is just left in temp. */
function removeLeftovers() {
  for (const dir of leftovers) {
    try {
      fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 })
    } catch {
      // harmless: the OS cleans the temp folder eventually
    }
  }
}

/** One launch: returns the app's report plus the peak memory of its process tree. */
async function runOnce(i) {
  const reportPath = path.join(os.tmpdir(), `blocksy-bench-${process.pid}-${i}.json`)
  fs.rmSync(reportPath, { force: true })
  const started = performance.now()
  // Its own WebView2 data folder: a cold WebView every run, and its processes are never
  // shared with another open Blocksy (e.g. pnpm dev), so memory counts only this app.
  const webviewData = path.join(os.tmpdir(), `blocksy-bench-webview-${process.pid}-${i}`)
  const env = { ...process.env, BLOCKSY_BENCH: reportPath, WEBVIEW2_USER_DATA_FOLDER: webviewData }
  const child = spawn(exe, [], { env, stdio: "ignore" })

  let peakMb = 0
  const sampler = setInterval(() => {
    try {
      peakMb = Math.max(peakMb, treeMemoryMb(child.pid))
    } catch {
      // the app may be exiting between listing and reading; skip this sample
    }
  }, 1000)

  const timeout = setTimeout(() => child.kill(), 60_000)
  const code = await new Promise((resolve) => child.on("exit", resolve))
  clearInterval(sampler)
  clearTimeout(timeout)
  const wallMs = performance.now() - started

  if (!fs.existsSync(reportPath)) throw new Error(`Run ${i + 1}: the app exited (code ${code}) without writing a report`)
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"))
  fs.rmSync(reportPath, { force: true })
  leftovers.push(webviewData) // deleted at the end: WebView2 may still be shutting down now
  return { ...report, peakMb, wallMs }
}

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

function machineInfo() {
  let gpu = "unknown"
  try {
    gpu = execFileSync("powershell", ["-NoProfile", "-Command", "(Get-CimInstance Win32_VideoController).Name -join ', '"], {
      encoding: "utf8",
    }).trim()
  } catch {
    // keep "unknown"
  }
  return {
    os: `${os.type()} ${os.release()}`,
    cpu: `${os.cpus()[0]?.model.trim()} (${os.cpus().length} threads)`,
    ramGb: Math.round(os.totalmem() / 1024 ** 3),
    gpu,
  }
}

function writeMarkdown(runs, machine, note) {
  const m = {
    coldStartMs: median(runs.map((r) => r.homeAtRustMs)),
    frameMedianMs: median(runs.map((r) => r.frames.medianMs)),
    frameP95Ms: median(runs.map((r) => r.frames.p95Ms)),
    // A run that ended before any memory sample landed has no memory number; skip it.
    memoryMb: median(runs.map((r) => r.peakMb).filter((mb) => mb > 0)),
    heapMb: median(runs.map((r) => r.jsHeapMb ?? 0)),
    previewReadyMs: median(runs.map((r) => r.preview?.readyMs ?? 0)),
    idleFrames: Math.max(...runs.map((r) => r.preview?.idleFrames ?? 0)),
  }
  const pass = (ok) => (ok ? "✅ pass" : "❌ over")
  const ms = (v) => `${Math.round(v)} ms`
  const first = runs[0]
  const lines = [
    `# Performance: Blocksy ${version}`,
    "",
    `Measured ${new Date().toISOString().slice(0, 10)} with \`pnpm bench\` (${runs.length} runs, medians shown).`,
    "",
    "## Machine",
    "",
    "| | |",
    "| --- | --- |",
    `| OS | ${machine.os} |`,
    `| CPU | ${machine.cpu} |`,
    `| RAM | ${machine.ramGb} GB |`,
    `| GPU | ${machine.gpu} |`,
    `| Screen | ${first.screen} at ${first.devicePixelRatio}x |`,
    "",
    "## Results",
    "",
    "| What | Result | Budget | |",
    "| --- | --- | --- | --- |",
    `| Cold start to Home | ${ms(m.coldStartMs)} | ${ms(BUDGET.coldStartMs)} | ${pass(m.coldStartMs <= BUDGET.coldStartMs)} |`,
    `| Frame time, median | ${m.frameMedianMs.toFixed(1)} ms | | |`,
    `| Frame time, 95th percentile | ${m.frameP95Ms.toFixed(1)} ms | ${BUDGET.frameP95Ms.toFixed(1)} ms (30 fps) | ${pass(m.frameP95Ms <= BUDGET.frameP95Ms)} |`,
    `| Memory, whole app (peak) | ${Math.round(m.memoryMb)} MB | ${BUDGET.memoryMb} MB | ${pass(m.memoryMb <= BUDGET.memoryMb)} |`,
    `| JS heap | ${m.heapMb.toFixed(1)} MB | | |`,
    `| Block preview ready (first open) | ${ms(m.previewReadyMs)} | ${ms(BUDGET.previewReadyMs)} | ${pass(m.previewReadyMs <= BUDGET.previewReadyMs)} |`,
    `| Frames drawn by an idle 3D view (2 s) | ${m.idleFrames} | ${BUDGET.idleFrames} | ${pass(m.idleFrames <= BUDGET.idleFrames)} |`,
    "",
    "Cold start counts from the Rust process starting to Home being painted (two frames after first render),",
    "with a fresh WebView2 data folder each run (a true cold start).",
    "The frame times cover a scripted workout: opening the build log, streaming 5,000 log lines,",
    "the New project and Settings dialogs, and switching pages. Memory adds up blocksy.exe and its",
    "WebView2 processes (private working set, as in Task Manager).",
    "The 3D rows open a project with 20 blocks in the editor, time until the first block's preview is drawn",
    "(WebGL start, shaders, texture), then count frames while it sits untouched for 2 seconds (render on demand).",
    "",
    ...(note ? [`> ${note}`, ""] : []),
    ...(process.env.BENCH_NOTE ? [`> ${process.env.BENCH_NOTE}`, ""] : []),
    "## Every run",
    "",
    "| Run | Cold start | Frame p95 | Memory | Preview ready | Idle 3D frames |",
    "| --- | --- | --- | --- | --- | --- |",
    ...runs.map((r, i) => `| ${i + 1} | ${ms(r.homeAtRustMs)} | ${r.frames.p95Ms.toFixed(1)} ms | ${r.peakMb > 0 ? `${Math.round(r.peakMb)} MB` : "no sample"} | ${r.preview ? ms(r.preview.readyMs) : "-"} | ${r.preview?.idleFrames ?? "-"} |`),
    "",
  ]
  const out = path.join(root, "docs/perf", `${minor}.md`)
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, lines.join("\n"))
  return { out, m }
}

if (process.platform !== "win32") {
  console.error("pnpm bench measures memory with Windows tools; run it on the Windows reference machine.")
  process.exit(1)
}

// Another open Blocksy no longer skews memory (each run has its own WebView2), but it
// still competes for CPU, so say so in the report.
const others = execFileSync("tasklist", ["/FI", "IMAGENAME eq blocksy.exe", "/NH"], { encoding: "utf8" })
const otherBlocksyOpen = others.toLowerCase().includes("blocksy.exe")
if (otherBlocksyOpen) console.warn("Note: another Blocksy is open; it may slow the frame times a little.")

buildIfStale()
// The first performance-counter query is slow (Windows loads the counters); do it now,
// so the first run gets memory samples too.
treeMemoryMb(process.pid)
const runs = []
for (let i = 0; i < RUNS; i++) {
  process.stdout.write(`Run ${i + 1}/${RUNS}… `)
  const run = await runOnce(i)
  runs.push(run)
  console.log(`start ${Math.round(run.homeAtRustMs)} ms, p95 ${run.frames.p95Ms.toFixed(1)} ms, ${Math.round(run.peakMb)} MB`)
}
removeLeftovers()
const note = otherBlocksyOpen ? "Measured with another Blocksy window open (a dev build), which may add a little CPU noise." : ""
const { out, m } = writeMarkdown(runs, machineInfo(), note)
console.log(`\nCold start ${Math.round(m.coldStartMs)} ms (budget ${BUDGET.coldStartMs}). Wrote ${path.relative(root, out)}`)
