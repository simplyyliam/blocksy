// The contract between the status bar widget and its views.
// A view says WHEN it applies and how important it is; the widget shows the
// most important view that applies. New view = new file + one line in views.ts.
import type { ComponentType } from "react"
import type { RunResult } from "../../shared/stores/gradle"
import type { JavaStatus } from "../../shared/stores/java"
import type { GradleTask } from "../../shared/bindings"

/** Everything a view's `when` may look at. */
export interface StatusSnapshot {
  task: GradleTask | null
  lastResult: RunResult | null
  hasProject: boolean
  javaStatus: JavaStatus
}

export interface StatusView {
  id: string
  /** Higher wins when several views apply. */
  priority: number
  when(snapshot: StatusSnapshot): boolean
  View: ComponentType
}
