// The project editor's own UI state: what is selected in the project tree, which
// view shows (Design or Code), and whether the tree column is open.
// The project itself lives in the project store (commands + undo/redo), not here.
import { create } from "zustand"

/** The Overview page. "@" can never start an element id, so no element can take its place. */
export const OVERVIEW = "@overview"

/** OVERVIEW or an element id. */
export type Selection = string

interface EditorState {
  selected: Selection
  view: "design" | "code"
  treeOpen: boolean
  select(selected: Selection): void
  setView(view: "design" | "code"): void
  toggleTree(): void
}

export const useEditor = create<EditorState>((set) => ({
  selected: OVERVIEW,
  view: "design",
  treeOpen: true,
  select: (selected) => set({ selected }),
  setView: (view) => set({ view }),
  toggleTree: () => set((s) => ({ treeOpen: !s.treeOpen })),
}))
