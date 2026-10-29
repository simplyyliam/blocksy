// Which JDK Blocksy builds with. Detection happens in Rust; choosing happens here.
import { create } from "zustand"
import { commands, type JavaInstall } from "../bindings"
import { call } from "../api"

export type JavaStatus = "checking" | "ready" | "missing"

interface JavaState {
  status: JavaStatus
  installs: JavaInstall[]
  /** The JDK builds will use, or null when none is good enough. */
  active: JavaInstall | null
  /** Lowest Java major version the open project (or any supported version) needs. */
  required: number
  detect(configuredHome: string | null, required: number): Promise<void>
}

/** Prefer the configured JDK if it's usable, else the newest JDK that's new enough. */
export function chooseJava(installs: JavaInstall[], configuredHome: string | null, required: number) {
  const usable = installs.filter((j) => j.is_jdk && j.major >= required)
  return usable.find((j) => j.home === configuredHome) ?? usable.sort((a, b) => b.major - a.major)[0] ?? null
}

export const useJava = create<JavaState>((set) => ({
  status: "checking",
  installs: [],
  active: null,
  required: 25,
  async detect(configuredHome, required) {
    set({ status: "checking", required })
    try {
      const installs = await call(commands.detectJava(configuredHome))
      const active = chooseJava(installs, configuredHome, required)
      set({ installs, active, status: active ? "ready" : "missing" })
    } catch {
      set({ installs: [], active: null, status: "missing" })
    }
  },
}))
