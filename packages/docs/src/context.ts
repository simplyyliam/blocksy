// What the app hands the Docs: where we are, how to move, and how to open the web.
// The Docs never import the app (lint enforces it); everything comes in through here.
import { createContext, useContext } from "react"
import type { ElementType } from "@blocksy/core"

export interface DocsHost {
  /** Current docs path, e.g. "/docs/learn/make-your-first-block". */
  path: string
  navigate(path: string): void
  /** Opens a web link in the user's browser (the app uses the OS opener). */
  openExternal(url: string): void
  /** Registered element types; their Reference pages are generated from them. */
  elementTypes: ElementType[]
  /** App version, for the version badge. */
  version: string
  /** What the docs are written for, from the registered loader target ("<loader> · Minecraft <versions>"). */
  platform: string
}

export const DocsHostContext = createContext<DocsHost | null>(null)

export function useDocsHost(): DocsHost {
  const host = useContext(DocsHostContext)
  if (!host) throw new Error("Docs components must be inside <DocsApp>")
  return host
}
