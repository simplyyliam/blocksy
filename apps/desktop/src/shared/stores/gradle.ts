// Gradle runs (Build, Run, Export) and their output.
// Output can arrive hundreds of lines per second, so lines are buffered and the
// UI is told about them at most once per animation frame (smooth, never janky).
import { create } from "zustand"
import { commands, events, type GradleTask } from "../bindings"
import { call } from "../api"

export interface LogLine {
  text: string
  error: boolean
}

/** Steps of a first build, recognised from real Gradle output. */
export const FIRST_BUILD_STEPS = [
  { id: "gradle", label: "Downloading Gradle", match: /Downloading https:\/\/services\.gradle\.org/ },
  { id: "daemon", label: "Starting Gradle", match: /Welcome to Gradle|Starting a Gradle Daemon/ },
  { id: "minecraft", label: "Setting up Minecraft", match: /> Configure project/ },
  { id: "compile", label: "Compiling your mod", match: /> Task :compile/ },
  { id: "datagen", label: "Generating block data", match: /> Task :runDatagen/, onlyWhenPreparing: true },
  { id: "package", label: "Packaging the jar", match: /> Task :(jar|remapJar)/ },
] as const

export interface RunResult {
  task: GradleTask
  success: boolean
  stopped: boolean
}

interface StartOptions {
  projectDir: string
  javaHome: string
  modId: string
  firstBuild: boolean
  /** v0.2: this build includes prepare tasks (shows the "Generating block data" step). */
  prepares?: boolean
  /** v0.2: the task list for task "prepare" (e.g. ["runDatagen"]). */
  tasks?: string[]
  /** v0.2: continue the previous run's log and steps (the build after its prepare step). */
  continues?: boolean
}

interface GradleState {
  runId: number | null
  task: GradleTask | null
  /** True while the project's very first build runs (shows the progress screen). */
  firstBuild: boolean
  /** True when this run starts with prepare tasks (e.g. data generation for blocks). */
  prepares: boolean
  /** Index into FIRST_BUILD_STEPS of the furthest step reached (the first-build timeline). */
  step: number
  /** Index of the step Gradle is on right now. Can go back: datagen runs before the build compiles again. */
  stepNow: number
  /** runClient: the game finished loading mods, and ours was among them. */
  gameLoaded: boolean
  modLoaded: boolean
  lastResult: RunResult | null
  /** Changes whenever log lines are added, so the log view knows to redraw. */
  logVersion: number
  start(task: GradleTask, opts: StartOptions): Promise<void>
  stop(): Promise<void>
  clearResult(): void
}

const MAX_LINES = 20_000
export const logLines: LogLine[] = []
let pending: LogLine[] = []
let frame = 0
let watchedModId = ""

export const useGradle = create<GradleState>((set, get) => ({
  runId: null,
  task: null,
  firstBuild: false,
  prepares: false,
  step: -1,
  stepNow: -1,
  gameLoaded: false,
  modLoaded: false,
  lastResult: null,
  logVersion: 0,

  async start(task, { projectDir, javaHome, modId, firstBuild, prepares = false, tasks = [], continues = false }) {
    if (!continues) {
      logLines.length = 0
      pending = []
    }
    watchedModId = modId
    const steps = continues ? {} : { step: -1, stepNow: -1 }
    set({ task, firstBuild, prepares, ...steps, gameLoaded: false, modLoaded: false, lastResult: null, logVersion: get().logVersion + 1 })
    try {
      // Prepare tasks have their own command, so v0.1's runGradle stays unchanged (ADR 0006).
      const run = task === "prepare" ? commands.runGradlePrepare(projectDir, tasks, javaHome) : commands.runGradle(projectDir, task, javaHome)
      const runId = await call(run)
      set({ runId })
    } catch (err) {
      set({ task: null, firstBuild: false })
      throw err
    }
  },

  async stop() {
    await call(commands.stopGradle())
  },

  clearResult: () => set({ lastResult: null }),
}))

/** Looks at each new line for build steps and for our mod in the game's mod list. */
function inspect(text: string) {
  const state = useGradle.getState()
  const step = FIRST_BUILD_STEPS.findIndex((s) => s.match.test(text))
  if (step > state.step) useGradle.setState({ step })
  if (step >= 0 && step !== state.stepNow) useGradle.setState({ stepNow: step })
  if (state.task === "run_client") {
    // Fabric prints "Loading 52 mods:" followed by "\t- modid 1.0.0" lines.
    if (/Loading \d+ mods:/.test(text)) useGradle.setState({ gameLoaded: true })
    if (watchedModId && new RegExp(`^\\s*-\\s+${watchedModId}\\s`).test(text)) useGradle.setState({ modLoaded: true })
  }
}

function flush() {
  frame = 0
  logLines.push(...pending)
  pending = []
  if (logLines.length > MAX_LINES) logLines.splice(0, logLines.length - MAX_LINES)
  useGradle.setState((s) => ({ logVersion: s.logVersion + 1 }))
}

/** Subscribes to Rust's Gradle events. Called once at start-up. */
export async function listenToGradle() {
  await events.gradleOutput.listen(({ payload }) => {
    if (payload.run_id !== useGradle.getState().runId && useGradle.getState().runId !== null) return
    const line = { text: payload.line, error: payload.stream === "stderr" }
    inspect(line.text)
    pending.push(line)
    if (!frame) frame = requestAnimationFrame(flush)
  })
  await events.gradleFinished.listen(({ payload }) => {
    if (frame) flush()
    useGradle.setState({
      runId: null,
      task: null,
      firstBuild: false,
      lastResult: { task: payload.task, success: payload.success, stopped: payload.stopped },
    })
  })
  // A task may already be running if the window reloaded mid-build.
  const running = await commands.gradleStatus()
  if (running) useGradle.setState({ runId: running.run_id, task: running.task })
}
