// Keeps the mod's files on disk in step with the project, right before Build and Run.
//
//   project ──generate()──▶ files ──write──▶ disk
//                              └─ files written last time but not now (a deleted
//                                 block's texture) are removed, using a manifest
//
// The manifest (.blocksy/generated.json) lists every path Blocksy wrote, so it only
// ever deletes its own files. It also remembers a fingerprint of the output, so data
// generation (a slow Gradle step) is skipped when nothing it reads has changed.
import type { Project } from "@blocksy/core"
import { generate } from "@blocksy/generator"
import { registries } from "../app/modules"
import { commands } from "./bindings"
import { call } from "./api"
import { joinPath } from "./paths"

const MANIFEST = ".blocksy/generated.json"

interface Manifest {
  paths: string[]
  /** Fingerprint of all generated files the last time the prepare tasks ran. */
  preparedFor?: string
}

/** A quick, stable fingerprint (FNV-1a) of the generated files. Not for security. */
function fingerprint(files: { path: string }[]): string {
  let hash = 0x811c9dc5
  const text = JSON.stringify(files)
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16)
}

async function readManifest(dir: string): Promise<Manifest> {
  try {
    return JSON.parse(await call(commands.readTextFile(joinPath(dir, MANIFEST)))) as Manifest
  } catch {
    return { paths: [] } // projects from v0.1 have no manifest yet
  }
}

export interface SyncResult {
  /** Prepare tasks this build needs; empty when the generated data is already up to date. */
  prepare: string[]
  /** Call after the build succeeded, so the next build can skip the prepare tasks. */
  markPrepared(): Promise<void>
}

/** Writes the project's files and works out which prepare tasks the build needs. */
export async function syncGeneratedFiles(dir: string, project: Project): Promise<SyncResult> {
  const files = generate(project, registries)
  const before = await readManifest(dir)
  const now = new Set(files.map((f) => f.path))

  await call(commands.writeProjectFiles(dir, files, true))
  const stale = before.paths.filter((p) => !now.has(p))
  if (stale.length > 0) await call(commands.removeProjectFiles(dir, stale))

  const target = registries.loaderTargets.require(project.target)
  const prepare = target.prepareTasks?.(project) ?? []
  const print = fingerprint(files)
  // Skip the prepare step when its inputs haven't changed since it last ran.
  const upToDate = before.preparedFor === print && (await commands.pathExists(joinPath(dir, "src/main/generated")))
  const paths = [...now].sort()
  const writeManifest = async (manifest: Manifest) => {
    await call(commands.writeTextFile(joinPath(dir, MANIFEST), `${JSON.stringify(manifest, null, 2)}\n`))
  }

  // Until this build succeeds, forget the fingerprint: a failed run must run again.
  await writeManifest({ paths, preparedFor: upToDate ? print : undefined })
  return {
    prepare: upToDate ? [] : prepare,
    markPrepared: () => (prepare.length > 0 ? writeManifest({ paths, preparedFor: print }) : Promise.resolve()),
  }
}
