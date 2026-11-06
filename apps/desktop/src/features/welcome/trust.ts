// Trusted projects. A Blocksy project is built with Gradle, which runs code that comes with the
// project, so the first time a folder is opened (cloned, dropped, picked) Blocksy asks, like
// JetBrains' "Trust and open?". Projects Blocksy created itself, and projects that were already
// in the recent list before this existed, are trusted from the start.
import { create } from "zustand"
import { samePath } from "../../shared/paths"
import { loadJson, saveJson } from "../../shared/stores/persist"
import { useRecent } from "../../shared/stores/recent"

/** Pure: is this folder in the trusted list? */
export const isTrustedIn = (dirs: string[], dir: string) => dirs.some((d) => samePath(d, dir))

/** Pure: the list with this folder added once. */
export const withTrusted = (dirs: string[], dir: string) => (isTrustedIn(dirs, dir) ? dirs : [...dirs, dir])

interface Prompt {
  dir: string
  resolve(trusted: boolean): void
}

interface TrustState {
  dirs: string[]
  loaded: boolean
  /** The question on screen, if any (the dialog in trust-dialog.tsx answers it). */
  prompt: Prompt | null
  load(): Promise<void>
  trust(dir: string): Promise<void>
  /** True when the folder is trusted already or the user says yes now. */
  ensure(dir: string): Promise<boolean>
}

let loading: Promise<void> | null = null

export const useTrust = create<TrustState>((set, get) => ({
  dirs: [],
  loaded: false,
  prompt: null,
  load() {
    // Once: the first caller reads the file; everyone else waits for the same read.
    loading ??= (async () => {
      const saved = await loadJson<{ dirs: string[] | null }>("trusted-projects", { dirs: null })
      // First run of this feature: what is already in the recent list was opened before, so it stays trusted.
      const dirs = saved.dirs ?? useRecent.getState().projects.map((p) => p.dir)
      if (saved.dirs === null) await saveJson("trusted-projects", { dirs }).catch(() => {})
      set({ dirs, loaded: true })
    })()
    return loading
  },
  async trust(dir) {
    await get().load()
    const dirs = withTrusted(get().dirs, dir)
    if (dirs === get().dirs) return
    set({ dirs })
    await saveJson("trusted-projects", { dirs })
  },
  async ensure(dir) {
    await get().load()
    if (isTrustedIn(get().dirs, dir)) return true
    const answer = await new Promise<boolean>((resolve) => set({ prompt: { dir, resolve } }))
    set({ prompt: null })
    if (answer) await get().trust(dir)
    return answer
  },
}))
