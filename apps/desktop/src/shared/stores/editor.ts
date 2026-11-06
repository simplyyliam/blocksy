// The project editor's own UI state: which tabs are open and which is showing, which
// view (Design or Code), and which side panels are open (tree, inspector, bottom dock).
// The project itself lives in the project store (commands + undo/redo), not here.
import { create } from "zustand"

/** The Overview page. "@" can never start an element id, so no element can take its place. */
export const OVERVIEW = "@overview"

/** v0.3: the History page (saved versions). "@" keeps it apart from element ids too. */
export const HISTORY = "@history"

/** v0.4 shell: the vanilla Library (every vanilla block and item) and the Docs, as view tabs. */
export const LIBRARY = "@library"
export const DOCS = "@docs"

/** The view tabs the activity bar opens. They are not elements. */
export const VIEWS = [OVERVIEW, LIBRARY, HISTORY, DOCS] as const
export const isView = (id: Selection) => (VIEWS as readonly string[]).includes(id)

/** A view tab (OVERVIEW, LIBRARY, HISTORY, DOCS) or an element id. */
export type Selection = string

/** The bottom dock's tabs. */
export type DockTab = "log" | "problems" | "history"

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
  /** The open tabs, in order (pinned ones always first). Selecting something opens its tab. */
  tabs: Selection[]
  /** The pinned tabs: kept at the left, no close button, and "Close others" leaves them open. */
  pinned: Selection[]
  selected: Selection
  view: "design" | "code"
  dockTab: DockTab
  /** Bumped by Reset layout: the panel group remounts so the default sizes apply. */
  layoutVersion: number
  /** The working mode per element type (item: paint or look), kept while the app runs. */
  modeByType: Record<string, string>
  /** The "New element" dialog (N): open, and the type chosen in it if any. */
  newElementOpen: boolean
  newElementType: string | null
  select(selected: Selection): void
  /** Closes a tab; if it was showing, the neighbour on its left takes over. */
  closeTab(id: Selection): void
  /** Closes every tab except one and the pinned ones (and keeps it selected). */
  closeOthers(id: Selection): void
  /** Pins a tab (it moves to the end of the pinned group) or unpins it (it moves just after it). */
  pin(id: Selection): void
  unpin(id: Selection): void
  /** Restores remembered tabs (layout memory). */
  restoreTabs(tabs: Selection[], pinned: Selection[], selected: Selection): void
  /** Moves to the next (1) or previous (-1) tab, wrapping around. */
  cycleTab(step: 1 | -1): void
  /** Drops tabs for elements that no longer exist (after delete or undo). */
  pruneTabs(existing: Set<string>): void
  setView(view: "design" | "code"): void
  setMode(type: string, mode: string): void
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
  pinned: [],
  selected: OVERVIEW,
  view: "design",
  dockTab: "log",
  layoutVersion: 0,
  modeByType: {},
  newElementOpen: false,
  newElementType: null,
  select: (selected) => set((s) => ({ selected, tabs: s.tabs.includes(selected) ? s.tabs : [...s.tabs, selected] })),
  closeTab: (id) =>
    set((s) => {
      const index = s.tabs.indexOf(id)
      if (index < 0) return s
      const tabs = s.tabs.filter((t) => t !== id)
      const pinned = s.pinned.filter((t) => t !== id)
      // Never leave the editor without a tab: Overview is the home tab.
      if (tabs.length === 0) return { tabs: [OVERVIEW], pinned: [], selected: OVERVIEW }
      const selected = s.selected === id ? tabs[Math.max(0, index - 1)]! : s.selected
      return { tabs, pinned, selected }
    }),
  closeOthers: (id) =>
    set((s) => {
      const tabs = s.tabs.filter((t) => t === id || s.pinned.includes(t))
      return { tabs, pinned: s.pinned.filter((t) => tabs.includes(t)), selected: id }
    }),
  pin: (id) =>
    set((s) => {
      if (!s.tabs.includes(id) || s.pinned.includes(id)) return s
      const pinned = [...s.pinned, id]
      return { pinned, tabs: [...pinned, ...s.tabs.filter((t) => !pinned.includes(t))] }
    }),
  unpin: (id) =>
    set((s) => {
      if (!s.pinned.includes(id)) return s
      const pinned = s.pinned.filter((t) => t !== id)
      // Back to the front of the loose tabs: right after the pinned group.
      return { pinned, tabs: [...pinned, id, ...s.tabs.filter((t) => !pinned.includes(t) && t !== id)] }
    }),
  restoreTabs: (tabs, pinned, selected) =>
    set(() => {
      const unique = [...new Set(tabs)]
      const keptPinned = pinned.filter((t) => unique.includes(t))
      const all = [...keptPinned, ...unique.filter((t) => !keptPinned.includes(t))]
      if (all.length === 0) return { tabs: [OVERVIEW], pinned: [], selected: OVERVIEW }
      return { tabs: all, pinned: keptPinned, selected: all.includes(selected) ? selected : all[0]! }
    }),
  cycleTab: (step) => {
    const { tabs, selected } = get()
    const at = tabs.indexOf(selected)
    set({ selected: tabs[(at + step + tabs.length) % tabs.length]! })
  },
  pruneTabs: (existing) =>
    set((s) => {
      const keep = (t: string) => isView(t) || existing.has(t)
      if (s.tabs.every(keep)) return s
      const tabs = s.tabs.filter(keep)
      return { tabs, pinned: s.pinned.filter(keep), selected: tabs.includes(s.selected) ? s.selected : OVERVIEW }
    }),
  setView: (view) => set({ view }),
  setMode: (type, mode) => set((s) => ({ modeByType: { ...s.modeByType, [type]: mode } })),
  setDockTab: (dockTab) => set({ dockTab }),
  toggleTree: () => set((s) => ({ treeOpen: !s.treeOpen })),
  toggleInspector: () => set((s) => ({ inspectorOpen: !s.inspectorOpen })),
  swapInspectorSide: () => set((s) => ({ inspectorSide: s.inspectorSide === "right" ? "left" : "right" })),
  setLayout: (layout) => set(layout),
  resetLayout: () => set((s) => ({ ...DEFAULT_LAYOUT, layoutVersion: s.layoutVersion + 1 })),
  openNewElement: (type) => set({ newElementOpen: true, newElementType: type ?? null }),
  closeNewElement: () => set({ newElementOpen: false, newElementType: null }),
  resetTabs: () => set({ tabs: [OVERVIEW], pinned: [], selected: OVERVIEW, view: "design" }),
}))
