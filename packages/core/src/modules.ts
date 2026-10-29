// The shapes of the modules that plug into Blocksy's registries (plan section 2.1).
// v0.1 defines every registry; shapes for later releases start small and grow
// in their release (new optional fields only, so earlier modules never change).
import type { z } from "zod"
import type { Element, Project } from "./project.ts"

/** One file the generator writes. Text files use `contents`, binary files `base64`. */
export type GeneratedFile = { path: string; contents: string } | { path: string; base64: string }

/** One Minecraft version a loader target supports, with its pinned toolchain. */
export interface TargetVersion {
  minecraft: string
  /** Java release the mod is compiled for (and the JDK the build needs). */
  java: number
  /** Exact, tested versions of the loader's tools, e.g. { loom: "1.19.3" }. */
  pins: Record<string, string>
}

/** What templates receive: the project plus the target's resolved choices. */
export interface GenerateContext {
  project: Project
  version: TargetVersion
  /** Folder layout decided by the target (Java source root, assets root, ...). */
  paths: Record<string, string>
}

/** A loader target (Fabric now, NeoForge later). The only place loaders are named. */
export interface LoaderTarget {
  id: string
  name: string
  versions: TargetVersion[]
  /** Folder layout for this project. */
  paths(project: Project): Record<string, string>
  /** The empty-mod files every project starts from (build scripts, entrypoint, ...). */
  scaffold(ctx: GenerateContext): GeneratedFile[]
}

/** An element type (block, item, ...). Templates are keyed by loader target id. */
export interface ElementType<Data = unknown> {
  id: string
  name: string
  schema: z.ZodType<Data>
  defaults(): Data
  templates: Record<string, (element: Element & { data: Data }, ctx: GenerateContext) => GeneratedFile[]>
}

/** A visual theme: token values only, never layout or behaviour (plan section 5). */
export interface Theme {
  id: string
  name: string
  /** CSS custom property name (without `--`) -> value. */
  tokens: Record<string, string>
}

/** Node types arrive in v0.4. */
export interface NodeType {
  id: string
  name: string
  family: string
}

/** GUI Studio components arrive in v0.9. */
export interface GuiComponent {
  id: string
  name: string
}

/** Model formats arrive in v0.5. */
export interface ModelFormat {
  id: string
  name: string
  extensions: string[]
}

/** Model Studio tools arrive in v0.5. */
export interface ModelStudioTool {
  id: string
  name: string
  shortcut?: string
}

/** Live docs demos arrive in v0.7. */
export interface DocsDemo {
  id: string
  title: string
}
