// Custom project covers, keyed by project folder. Each one is read from disk once
// (Rust: commands/covers.rs) and kept here, so every place that shows the project
// (Home, sidebar, breadcrumb) updates together when the cover changes.
import { open as pickFile } from "@tauri-apps/plugin-dialog"
import { create } from "zustand"
import { commands } from "../bindings"
import { call } from "../api"

interface CoversState {
  /** data: URL of the custom cover, null = use the generated one, missing = not read yet. */
  byDir: Record<string, string | null>
  load(dir: string): Promise<void>
  /** Asks for a picture and makes it the cover. Returns false if the user cancelled. */
  choose(dir: string): Promise<boolean>
  reset(dir: string): Promise<void>
}

const loading = new Set<string>()

export const useCovers = create<CoversState>((set, get) => ({
  byDir: {},
  async load(dir) {
    if (dir in get().byDir || loading.has(dir)) return
    loading.add(dir)
    try {
      const url = await call(commands.readProjectCover(dir))
      set((s) => ({ byDir: { ...s.byDir, [dir]: url } }))
    } catch {
      set((s) => ({ byDir: { ...s.byDir, [dir]: null } })) // unreadable: fall back quietly
    } finally {
      loading.delete(dir)
    }
  },
  async choose(dir) {
    const picked = await pickFile({
      title: "Choose a cover picture",
      filters: [{ name: "Pictures", extensions: ["png", "jpg", "jpeg", "webp"] }],
    })
    if (typeof picked !== "string") return false
    const url = await call(commands.setProjectCover(dir, picked))
    set((s) => ({ byDir: { ...s.byDir, [dir]: url } }))
    return true
  },
  async reset(dir) {
    await call(commands.clearProjectCover(dir))
    set((s) => ({ byDir: { ...s.byDir, [dir]: null } }))
  },
}))
