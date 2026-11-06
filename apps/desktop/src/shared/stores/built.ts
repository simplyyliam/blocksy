// "Changed since the last build": which version of each element the game last got.
// Autosave writes every change within 300 ms, so "unsaved" never means anything here; what a
// maker wants to know is "does the game have this yet?". The tab strip shows a dot for it.
//
// A snapshot of the elements is taken when a Build or Run starts and kept once that task
// succeeds (edits made while it runs still count as changed). It lives for the app session;
// before the first successful build there is nothing to compare with, so no dots show.
import { create } from "zustand"
import type { Element } from "@blocksy/core"
import { useGradle } from "./gradle"
import { useProject } from "./project"

interface BuiltState {
  /** The elements as the last successful build saw them (by id), or null before the first build. */
  snapshot: ReadonlyMap<string, Element> | null
  reset(): void
}

export const useBuilt = create<BuiltState>((set) => ({
  snapshot: null,
  reset: () => set({ snapshot: null }),
}))

/** True when the game's copy of this element differs from the one in the project. */
export function changedSinceBuild(snapshot: BuiltState["snapshot"], element: Element | undefined): boolean {
  if (!snapshot || !element) return false
  const built = snapshot.get(element.id)
  if (built === element) return false // documents are immutable: the same object means unchanged
  if (!built) return true // created after the build
  return JSON.stringify(built) !== JSON.stringify(element) // e.g. an edit that was undone
}

/** Starts watching Gradle tasks; returns the stop function. Called once by the project layout. */
export function watchBuilds(): () => void {
  let pending: { dir: string; elements: Map<string, Element> } | null = null
  return useGradle.subscribe((state, prev) => {
    if (prev.task === null && (state.task === "build" || state.task === "run_client")) {
      const current = useProject.getState().current
      pending = current ? { dir: current.dir, elements: new Map(current.doc.elements.map((e) => [e.id, e])) } : null
    }
    const result = state.lastResult
    if (result && result !== prev.lastResult) {
      // Only a successful build of the project that is still open counts; anything else drops the snapshot.
      if (result.success && pending && pending.dir === useProject.getState().current?.dir && (result.task === "build" || result.task === "run_client")) {
        useBuilt.setState({ snapshot: pending.elements })
      }
      pending = null
    }
  })
}
