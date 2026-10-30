// The shapes of the modules that plug into Blocksy's registries (plan section 2.1).
// v0.1 defines every registry; shapes for later releases start small and grow
// in their release (new optional fields only, so earlier modules never change).
import type { z } from "zod"
import type { Element, Project } from "./project.ts"

/**
 * One file the generator writes. Text files use `contents`, binary files `base64`.
 * `executable` marks scripts (like gradlew) that need run permission on macOS/Linux.
 */
export type GeneratedFile = ({ path: string; contents: string } | { path: string; base64: string }) & {
  executable?: boolean
}

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
  /**
   * v0.2: this loader's code for element types, keyed by element type id.
   * Loader code lives here, not in the element (rule 5), so a new loader adds
   * its adapters without touching any element package (ADR 0006).
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapters?: Record<string, ElementTemplate<any>>
  /**
   * v0.2: build tasks that must run before Build or Run for this project
   * (Fabric: data generation once the mod has blocks). Empty or missing = none.
   */
  prepareTasks?(project: Project): string[]
}

/** Turns one element into files for one loader target. */
export type ElementTemplate<Data = unknown> = (element: Element & { data: Data }, ctx: GenerateContext) => GeneratedFile[]

/** One field of an element, described for its generated Docs reference page. */
export interface ElementFieldDoc {
  key: string
  label: string
  /** Plain-language explanation, one or two sentences. */
  description: string
  /** What the field becomes in Java, e.g. ".strength(hardness, resistance)". */
  java?: string
}

/** The Docs reference page of an element type, generated from this data (plan 11.2). */
export interface ElementDocs {
  /** One paragraph: what the element is and when to use it. */
  summary: string
  fields: ElementFieldDoc[]
}

/** An element type (block, item, ...). Templates are keyed by loader target id. */
export interface ElementType<Data = unknown> {
  id: string
  name: string
  schema: z.ZodType<Data>
  defaults(): Data
  /** Templates keyed by target id. A target may also bring them as `adapters`. */
  templates: Record<string, ElementTemplate<Data>>
  /** v0.2: plural name for groups in the project tree ("Blocks"). */
  plural?: string
  /** v0.2: the data behind this element's Docs reference page. */
  docs?: ElementDocs
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
