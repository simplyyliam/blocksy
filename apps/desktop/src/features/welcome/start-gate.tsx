// The start gate: decides what the welcome window shows first.
//
// It holds an ordered list of "first launch views", each with a `when(state)` check, like the
// status bar's views. The first one whose check passes replaces the welcome body. The list is
// empty today. The sign-in release (v0.14, docs/release/releases/v0.14.md) adds one entry here:
// a sign-in view (keychain session, log out, "Continue offline"), so it shows before the
// welcome view on first launch. Nothing else in the window has to change.
import type { ReactNode } from "react"
import { firstLaunchViews, type GateState } from "./first-launch-views"

export function StartGate({ state, children }: { state: GateState; children: ReactNode }) {
  const gate = firstLaunchViews.find((v) => v.when(state))
  return gate ? <gate.View /> : children
}
