// The workspace index (ADR 0011): a tiny JSON file, `.blocksy/workspace-index.json`, with the
// paths of this project's Minecraft files in the user's Gradle cache: the client jar, the asset
// index and the loader jars. Like MCreator's generatorGradleCache, it lets the editor find
// Minecraft's look instantly without running Gradle again.
//
// It holds PATHS ONLY (no Minecraft content) and paths are machine-specific, so `.blocksy/`
// is git-ignored in every project (new ones from the generator, old ones when they open).
import { commands, type WorkspaceFiles } from "../bindings"
import { call } from "../api"
import { joinPath } from "../paths"

export const INDEX_FORMAT = 1
export const INDEX_FILE = ".blocksy/workspace-index.json"
export const IGNORE_ENTRY = ".blocksy/"

export interface WorkspaceIndex {
  formatVersion: typeof INDEX_FORMAT
  /** The Minecraft version the paths belong to; a project on another version needs a new index. */
  minecraft: string
  loader: string
  clientJar: string | null
  assetIndex: string | null
  assetObjects: string | null
  loaderJars: string[]
}

const text = (v: unknown): string | null => (typeof v === "string" && v.length > 0 ? v : null)

/** Reads the file's text into an index, or null if it isn't a valid index of this format. */
export function parseIndex(raw: string): WorkspaceIndex | null {
  try {
    const json = JSON.parse(raw) as Record<string, unknown>
    if (json.formatVersion !== INDEX_FORMAT) return null // a future/older format: rebuild it
    const minecraft = text(json.minecraft)
    const loader = text(json.loader)
    if (!minecraft || !loader) return null
    return {
      formatVersion: INDEX_FORMAT,
      minecraft,
      loader,
      clientJar: text(json.clientJar),
      assetIndex: text(json.assetIndex),
      assetObjects: text(json.assetObjects),
      loaderJars: Array.isArray(json.loaderJars) ? json.loaderJars.filter((p): p is string => typeof p === "string") : [],
    }
  } catch {
    return null
  }
}

export function makeIndex(minecraft: string, loader: string, files: WorkspaceFiles): WorkspaceIndex {
  return {
    formatVersion: INDEX_FORMAT,
    minecraft,
    loader,
    clientJar: files.clientJar ?? null,
    assetIndex: files.assetIndex ?? null,
    assetObjects: files.assetObjects ?? null,
    loaderJars: files.loaderJars ?? [],
  }
}

/** True when this index can be used for the project as it is now (same version, has the jar). */
export function indexMatches(index: WorkspaceIndex, minecraft: string, loader: string): boolean {
  return index.minecraft === minecraft && index.loader === loader && index.clientJar !== null
}

/** Adds ".blocksy/" to a .gitignore text if it is not in there already (keeps the rest as is). */
export function withIgnoreEntry(gitignore: string | null): string | null {
  const lines = (gitignore ?? "").split(/\r?\n/).map((l) => l.trim())
  if (lines.includes(IGNORE_ENTRY) || lines.includes(".blocksy")) return null // nothing to change
  const base = gitignore ?? ""
  const separator = base === "" || base.endsWith("\n") ? "" : "\n"
  return `${base}${separator}${base === "" ? "" : "\n"}# Blocksy: paths into this computer's Gradle cache (never commit or share)\n${IGNORE_ENTRY}\n`
}

/** Existing projects get the ignore entry when they open (new ones have it from the generator). */
export async function ensureIgnored(dir: string) {
  const path = joinPath(dir, ".gitignore")
  const current = (await commands.pathExists(path)) ? await call(commands.readTextFile(path)) : null
  const next = withIgnoreEntry(current)
  if (next !== null) await call(commands.writeTextFile(path, next))
}

/** The saved index, if it exists and is valid. */
export async function readIndex(dir: string): Promise<WorkspaceIndex | null> {
  const path = joinPath(dir, INDEX_FILE)
  if (!(await commands.pathExists(path))) return null
  return parseIndex(await call(commands.readTextFile(path)))
}

/**
 * The index for this project: the saved one if it still fits, otherwise a fresh one built from
 * what the Gradle cache has now (and saved). `force` rebuilds even when the saved one fits,
 * used after a Gradle run, which may have just downloaded the files.
 */
export async function loadOrBuildIndex(dir: string, minecraft: string, loader: string, force = false): Promise<WorkspaceIndex> {
  if (!force) {
    const saved = await readIndex(dir)
    // A saved index only counts while the jar it names is still there (the cache may have been cleared).
    if (saved && indexMatches(saved, minecraft, loader) && (await commands.pathExists(saved.clientJar!))) return saved
  }
  const index = makeIndex(minecraft, loader, await call(commands.findWorkspaceFiles(minecraft)))
  // Only write when something was found: an empty index would hide the "Build once" state.
  if (index.clientJar) await call(commands.writeTextFile(joinPath(dir, INDEX_FILE), `${JSON.stringify(index, null, 2)}\n`))
  return index
}
