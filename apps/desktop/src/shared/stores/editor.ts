// The project editor's own UI state: which tabs are open and which is showing, which
// view (Design or Code), and which side panels are open (tree, inspector, bottom dock).
// The project itself lives in the project store (commands + undo/redo), not here.
import { create } from "zustand"

/** The Overview page. "@" can never start an element id, so no element can take its place. */
export const OVERVIEW = "@overview"

/** v0.3: the History page (saved versions). "@" keeps it apart from element ids too. */
export const HISTORY = "@history"

/** OVERVIEW, HISTORY or an element id. */
export type Selection = string

/** The bottom dock's tabs. */
export type DockTab = "log" | "problems"

/** The panel sizes and visibility that are remembered per project (see shared/layout-memory.ts). */
export interface PanelLayout {
  treeOpen: boolean
  inspectorOpen: boolean
  /** Sizes in pixels. */
  treeWidth: number
  inspectorWidth: number
  dockHeight: number
  /** v0.4: the inspector can swap to the left of the canvas. */
  inspectorSide: "left" | "right"
}

export const DEFAULT_LAYOUT: PanelLayout = {
  treeOpen: true,
  inspectorOpen: true,
  treeWidth: 232,
  inspectorWidth: 296,
  dockHeight: 240,
  inspectorSide: "right",
}

interface EditorState extends PanelLayout {
  /** The open tabs, in order. Selecting something opens its tab. */
  tabs: Selection[]
  selected: Selection
  view: "design" | "code"
  dockTab: DockTab
  /** The "New element" dialog (N): open, and the type chosen in it if any. */
  newElementOpen: boolean
  newElementType: string | null
  select(selected: Selection): void
  /** Closes a tab; if it was showing, the neighbour on its left takes over. */
  closeTab(id: Selection): void
  /** Closes every tab except one (and keeps it selected). */
  closeOthers(id: Selection): void
  /** Moves to the next (1) or previous (-1) tab, wrapping around. */
  cycleTab(step: 1 | -1): void
  /** Drops tabs for elements that no longer exist (after delete or undo). */
  pruneTabs(existing: Set<string>): void
  setView(view: "design" | "code"): void
  setDockTab(tab: DockTab): void
  toggleTree(): void
  toggleInspector(): void
  swapInspectorSide(): void
  setLayout(layout: Partial<PanelLayout>): void
  resetLayout(): void
  openNewElement(type?: string): void
  closeNewElement(): void
  /** A freshly opened project: Overview only. */
  resetTabs(): void
}

export const useEditor = create<EditorState>((set, get) => ({
  ...DEFAULT_LAYOUT,
  tabs: [OVERVIEW],
  selected: OVERVIEW,
  view: "design",
  dockTab: "log",
  newElementOpen: false,
  newElementType: null,
  select: (selected) => set((s) => ({ selected, tabs: s.tabs.includes(selected) ? s.tabs : [...s.tabs, selected] })),
  closeTab: (id) =>
    set((s) => {
      const index = s.tabs.indexOf(id)
      if (index < 0) return s
      const tabs = s.tabs.filter((t) => t !== id)
      // Never leave the editor without a tab: Overview is the home tab.
      if (tabs.length === 0) return { tabs: [OVERVIEW], selected: OVERVIEW }
      const selected = s.selected === id ? tabs[Math.max(0, index - 1)]! : s.selected
      return { tabs, selected }
    }),
  closeOthers: (id) => set({ tabs: [id], selected: id }),
  cycleTab: (step) => {
    const { tabs, selected } = get()
    const at = tabs.indexOf(selected)
    set({ selected: tabs[(at + step + tabs.length) % tabs.length]! })
  },
  pruneTabs: (existing) =>
    set((s) => {
      const keep = (t: string) => t === OVERVIEW || t === HISTORY || existing.has(t)
      if (s.tabs.every(keep)) return s
      const tabs = s.tabs.filter(keep)
      return { tabs, selected: tabs.includes(s.selected) ? s.selected : OVERVIEW }
    }),
  setView: (view) => set({ view }),
  setDockTab: (dockTab) => set({ dockTab }),
  toggleTree: () => set((s) => ({ treeOpen: !s.treeOpen })),
  toggleInspector: () => set((s) => ({ inspectorOpen: !s.inspectorOpen })),
  swapInspectorSide: () => set((s) => ({ inspectorSide: s.inspectorSide === "right" ? "left" : "right" })),
  setLayout: (layout) => set(layout),
  resetLayout: () => set(DEFAULT_LAYOUT),
  openNewElement: (type) => set({ newElementOpen: true, newElementType: type ?? null }),
  closeNewElement: () => set({ newElementOpen: false, newElementType: null }),
  resetTabs: () => set({ tabs: [OVERVIEW], selected: OVERVIEW, view: "design" }),
}))
