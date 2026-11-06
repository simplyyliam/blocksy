// The list of first-launch views the start gate can show (see start-gate.tsx).
import type { ComponentType } from "react"

export interface GateState {
  /** True until the settings and the recent list have loaded. */
  loading: boolean
}

export interface FirstLaunchView {
  id: string
  /** Show this view instead of the welcome body? */
  when(state: GateState): boolean
  View: ComponentType
}

/** Ordered: the first match wins. Empty until the sign-in release. */
export const firstLaunchViews: FirstLaunchView[] = []
