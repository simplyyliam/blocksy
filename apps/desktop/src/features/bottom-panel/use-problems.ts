// What is wrong with the open project right now: core's validateProject, re-run on every change.
import { useSyncExternalStore } from "react"
import { validateProject } from "@blocksy/core"
import { registries } from "../../app/modules"
import { useProject } from "../../shared/stores/project"

/** The current problems, as plain messages (empty = all good). */
export function useProblems(): string[] {
  const project = useProject((s) => s.current)
  // Re-check whenever the document changes.
  const doc = useSyncExternalStore(
    (cb) => project?.documents.subscribe(cb) ?? (() => {}),
    () => project?.documents.get(),
  )
  return doc ? validateProject(doc, registries) : []
}

