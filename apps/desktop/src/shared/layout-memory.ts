// Remembers each project's panel layout (which panels are open, how wide) in the app-data
// folder, one small JSON file keyed by project folder. Applied when a project opens.
import { useEffect, useState } from "react"
import { DEFAULT_LAYOUT, isView, useEditor, type PanelLayout } from "./stores/editor"
import { useNavigation } from "./stores/navigation"
import { loadJson, saveJson } from "./stores/persist"
import { useProject } from "./stores/project"

const FILE = "editor-layouts" // a plain name; the Rust side adds .json

interface Saved extends PanelLayout {
  dockOpen: boolean
  /** The open tabs, the pinned ones and the showing one (ADR 0019: tabs are remembered per project). */
  tabs: string[]
  pinned: string[]
  selected: string
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
    tabs: s.tabs,
    pinned: s.pinned,
    selected: s.selected,
  }
}

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [])

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
    tabs: strings(saved.tabs),
    pinned: strings(saved.pinned),
    selected: typeof saved.selected === "string" ? saved.selected : "",
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
    let dirty = false

    const save = async () => {
      const store = await loadJson<Store>(FILE, { byDir: {} })
      await saveJson(FILE, { byDir: { ...store.byDir, [dir]: pick() } })
    }
    const queue = () => {
      if (!ready) return
      clearTimeout(timer)
      dirty = true
      timer = setTimeout(() => {
        dirty = false
        void save().catch(() => {})
      }, 600)
    }

    void loadJson<Store>(FILE, { byDir: {} }).then((store) => {
      if (!alive) return
      const { dockOpen, tabs, pinned, selected, ...layout } = sane(store.byDir[dir] ?? {})
      useEditor.getState().setLayout(layout)
      // Element tabs only come back if the element still exists (it may have been deleted since).
      const ids = new Set(useProject.getState().current?.doc.elements.map((e) => e.id))
      const exists = (t: string) => isView(t) || ids.has(t)
      if (tabs?.length) useEditor.getState().restoreTabs(tabs.filter(exists), (pinned ?? []).filter(exists), selected ?? "")
      useNavigation.getState().setBottomPanel(dockOpen === true)
      ready = true
      setLoadedDir(dir)
    })

    // Layout and tab changes count (saves are debounced); typing in an element does not.
    const sig = (s: PanelLayout & { tabs: string[]; pinned: string[]; selected: string }) =>
      `${s.treeOpen}|${s.inspectorOpen}|${s.treeWidth}|${s.inspectorWidth}|${s.dockHeight}|${s.inspectorSide}|${s.tabs.join(",")}|${s.pinned.join(",")}|${s.selected}`
    const stopEditor = useEditor.subscribe((s, prev) => sig(s) !== sig(prev) && queue())
    const stopNav = useNavigation.subscribe((s, prev) => s.bottomPanelOpen !== prev.bottomPanelOpen && queue())
    return () => {
      alive = false
      clearTimeout(timer)
      if (dirty) void save().catch(() => {}) // a change in the last moments is not lost
      stopEditor()
      stopNav()
    }
  }, [dir])
  return dir !== undefined && loadedDir === dir
}
