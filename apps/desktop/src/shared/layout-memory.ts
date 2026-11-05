// Remembers each project's panel layout (which panels are open, how wide) in the app-data
// folder, one small JSON file keyed by project folder. Applied when a project opens.
import { useEffect, useState } from "react"
import { DEFAULT_LAYOUT, useEditor, type PanelLayout } from "./stores/editor"
import { useNavigation } from "./stores/navigation"
import { loadJson, saveJson } from "./stores/persist"

const FILE = "editor-layouts.json"

interface Saved extends PanelLayout {
  dockOpen: boolean
}

type Store = { byDir: Record<string, Partial<Saved>> }

const pick = (): Saved => {
  const s = useEditor.getState()
  return {
    treeOpen: s.treeOpen,
    inspectorOpen: s.inspectorOpen,
    treeWidth: s.treeWidth,
    inspectorWidth: s.inspectorWidth,
    dockHeight: s.dockHeight,
    inspectorSide: s.inspectorSide,
    dockOpen: useNavigation.getState().bottomPanelOpen,
  }
}

/** Clamps stored sizes so a hand-edited or old file can't produce an unusable layout. */
function sane(saved: Partial<Saved>): Partial<Saved> {
  const n = (v: unknown, min: number, max: number, fallback: number) =>
    typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback
  return {
    treeOpen: saved.treeOpen ?? DEFAULT_LAYOUT.treeOpen,
    inspectorOpen: saved.inspectorOpen ?? DEFAULT_LAYOUT.inspectorOpen,
    treeWidth: n(saved.treeWidth, 160, 520, DEFAULT_LAYOUT.treeWidth),
    inspectorWidth: n(saved.inspectorWidth, 220, 560, DEFAULT_LAYOUT.inspectorWidth),
    dockHeight: n(saved.dockHeight, 120, 800, DEFAULT_LAYOUT.dockHeight),
    inspectorSide: saved.inspectorSide === "left" ? "left" : "right",
    dockOpen: saved.dockOpen === true,
  }
}

/**
 * Loads the layout when `dir` opens, then saves changes (debounced) while it stays open.
 * Returns true once the saved layout is applied, so panels mount at the right size.
 */
export function useLayoutMemory(dir: string | undefined): boolean {
  // Which project's layout is loaded (comparing with `dir` makes a new project "not ready" at once).
  const [loadedDir, setLoadedDir] = useState<string | undefined>()
  useEffect(() => {
    if (!dir) return
    let alive = true
    let ready = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const save = async () => {
      const store = await loadJson<Store>(FILE, { byDir: {} })
      await saveJson(FILE, { byDir: { ...store.byDir, [dir]: pick() } })
    }
    const queue = () => {
      if (!ready) return
      clearTimeout(timer)
      timer = setTimeout(() => void save().catch(() => {}), 600)
    }

    void loadJson<Store>(FILE, { byDir: {} }).then((store) => {
      if (!alive) return
      const { dockOpen, ...layout } = sane(store.byDir[dir] ?? {})
      useEditor.getState().setLayout(layout)
      useNavigation.getState().setBottomPanel(dockOpen === true)
      ready = true
      setLoadedDir(dir)
    })

    // Only layout changes count; switching tabs or selecting an element must not trigger a save.
    const sig = (s: PanelLayout) => `${s.treeOpen}|${s.inspectorOpen}|${s.treeWidth}|${s.inspectorWidth}|${s.dockHeight}|${s.inspectorSide}`
    const stopEditor = useEditor.subscribe((s, prev) => sig(s) !== sig(prev) && queue())
    const stopNav = useNavigation.subscribe((s, prev) => s.bottomPanelOpen !== prev.bottomPanelOpen && queue())
    return () => {
      alive = false
      clearTimeout(timer)
      stopEditor()
      stopNav()
    }
  }, [dir])
  return dir !== undefined && loadedDir === dir
}
