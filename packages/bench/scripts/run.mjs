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
const version = JSON.parse(fs.readFileSync(path.join(desktop, "src-tauri/tauri.conf.json"), "utf8")).version
const minor = version.split(".").slice(0, 2).join(".")

// The budget from plan section 4 that v0.1 can measure (an empty app, no 3D yet).
const BUDGET = { coldStartMs: 2500, memoryMb: 600, frameP95Ms: 1000 / 30 }

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

/** Total working set (MB) of a process and all its descendants (WebView2 lives there). */
function treeMemoryMb(pid) {
  const script =
    "Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,WorkingSetSize | ConvertTo-Json -Compress"
  const all = JSON.parse(execFileSync("powershell", ["-NoProfile", "-Command", script], { encoding: "utf8" }))
  const children = new Map()
  for (const p of all) children.set(p.ParentProcessId, [...(children.get(p.ParentProcessId) ?? []), p])
  let bytes = 0
  const stack = all.filter((p) => p.ProcessId === pid)
  while (stack.length) {
    const p = stack.pop()
    bytes += Number(p.WorkingSetSize)
    stack.push(...(children.get(p.ProcessId) ?? []))
  }
  return bytes / 1024 / 1024
}

/** One launch: returns the app's report plus the peak memory of its process tree. */
async function runOnce(i) {
  const reportPath = path.join(os.tmpdir(), `blocksy-bench-${process.pid}-${i}.json`)
  fs.rmSync(reportPath, { force: true })
  const started = performance.now()
  const child = spawn(exe, [], { env: { ...process.env, BLOCKSY_BENCH: reportPath }, stdio: "ignore" })

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

function writeMarkdown(runs, machine) {
  const m = {
    coldStartMs: median(runs.map((r) => r.homeAtRustMs)),
    frameMedianMs: median(runs.map((r) => r.frames.medianMs)),
    frameP95Ms: median(runs.map((r) => r.frames.p95Ms)),
    memoryMb: median(runs.map((r) => r.peakMb)),
    heapMb: median(runs.map((r) => r.jsHeapMb ?? 0)),
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
    "",
    "Cold start counts from the Rust process starting to Home being painted (two frames after first render).",
    "The frame times cover a scripted workout: opening the build log, streaming 5,000 log lines,",
    "the New project and Settings dialogs, and switching pages. Memory adds up blocksy.exe and its",
    "WebView2 processes. v0.1 has no 3D views yet, so the 3D budgets start with Model Studio.",
    "",
    "## Every run",
    "",
    "| Run | Cold start | Frame p95 | Memory |",
    "| --- | --- | --- | --- |",
    ...runs.map((r, i) => `| ${i + 1} | ${ms(r.homeAtRustMs)} | ${r.frames.p95Ms.toFixed(1)} ms | ${Math.round(r.peakMb)} MB |`),
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

// Another Blocksy (e.g. `pnpm dev`) shares the same WebView2 processes, which hides most
// of the memory and slows the frames. Measure only when this is the only Blocksy running.
const others = execFileSync("tasklist", ["/FI", "IMAGENAME eq blocksy.exe", "/NH"], { encoding: "utf8" })
if (others.toLowerCase().includes("blocksy.exe")) {
  console.error("Close every other Blocksy window (including pnpm dev) first: they share WebView2 and skew the numbers.")
  process.exit(1)
}

buildIfStale()
const runs = []
for (let i = 0; i < RUNS; i++) {
  process.stdout.write(`Run ${i + 1}/${RUNS}… `)
  const run = await runOnce(i)
  runs.push(run)
  console.log(`start ${Math.round(run.homeAtRustMs)} ms, p95 ${run.frames.p95Ms.toFixed(1)} ms, ${Math.round(run.peakMb)} MB`)
}
const { out, m } = writeMarkdown(runs, machineInfo())
console.log(`\nCold start ${Math.round(m.coldStartMs)} ms (budget ${BUDGET.coldStartMs}). Wrote ${path.relative(root, out)}`)
