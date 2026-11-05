// Gives every Minecraft-look component its assets. The app wraps the editor in this and
// supplies a `McAssets` made from the user's own Gradle cache; nothing here reads files.
import { createContext, useContext, type ReactNode } from "react"
import type { McAssets, McStatus } from "./types.ts"

interface McContextValue {
  assets: McAssets | null
  status: McStatus
  /** "Build once" action shown in the placeholder (runs the project's first build). */
  onBuild?: () => void
}

const Context = createContext<McContextValue>({ assets: null, status: "missing" })

export function MinecraftProvider({ assets, status, onBuild, children }: McContextValue & { children: ReactNode }) {
  return <Context.Provider value={{ assets, status, onBuild }}>{children}</Context.Provider>
}

export const useMinecraft = () => useContext(Context)
