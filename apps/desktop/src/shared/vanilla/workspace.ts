// The workspace: whether Minecraft's look is available for the open project, and the reader.
//   missing  -> no client jar in the Gradle cache yet ("Build once to load Minecraft's look")
//   ready    -> the index points at a client jar; `assets` reads it
// The index (workspace-index.ts) is the fast path: when it fits, nothing scans the cache.
import { create } from "zustand"
import { commands } from "../bindings"
import { call } from "../api"
import { VanillaAssets } from "./reader"
import { ensureIgnored, loadOrBuildIndex, type WorkspaceIndex } from "./workspace-index"

type Status = "loading" | "ready" | "missing"

interface WorkspaceState {
  status: Status
  index: WorkspaceIndex | null
  assets: VanillaAssets | null
  /** The user chose "Open editor now": the setup progress screen stays away for this run. */
  setupHidden: boolean
  hideSetup(): void
  /**
   * (Re)loads the index for a project. `force` rebuilds it from the Gradle cache, used after a
   * Gradle run (which may just have downloaded Minecraft) and when the Minecraft version changed.
   */
  refresh(dir: string, minecraft: string, loader: string, force?: boolean): Promise<void>
  reset(): void
}

const decode = (base64: string) => Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))

/** A reader whose bytes come from the client jar through Rust (nothing is stored on the way). */
function jarSource(jar: string) {
  return {
    async readBytes(entry: string) {
      const base64 = await call(commands.readJarEntry(jar, entry))
      return base64 ? decode(base64) : null
    },
  }
}

export const useWorkspace = create<WorkspaceState>((set, get) => ({
  status: "loading",
  index: null,
  assets: null,
  setupHidden: false,
  hideSetup: () => set({ setupHidden: true }),

  async refresh(dir, minecraft, loader, force = false) {
    try {
      await ensureIgnored(dir) // keep `.blocksy/` out of git, also in older projects
      const index = await loadOrBuildIndex(dir, minecraft, loader, force)
      if (!index.clientJar) return set({ status: "missing", index, assets: null })
      // Keep the open reader (and its caches) when it already reads this very jar.
      const same = get().index?.clientJar === index.clientJar && get().assets
      set({ status: "ready", index, assets: same || new VanillaAssets(jarSource(index.clientJar)) })
    } catch {
      set({ status: "missing", index: null, assets: null })
    }
  },

  reset: () => set({ status: "loading", index: null, assets: null, setupHidden: false }),
}))
