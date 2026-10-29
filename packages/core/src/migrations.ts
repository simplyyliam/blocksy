// Migrations upgrade old project files step by step, so old projects always open.
// Each migration moves the data from one formatVersion to the next.
import { CURRENT_FORMAT_VERSION, projectSchema, type Project } from "./project.ts"

export interface Migration {
  from: number
  to: number
  /** Plain-language summary, shown in logs ("Adds a version field"). */
  describe: string
  migrate(data: Record<string, unknown>): Record<string, unknown>
}

/**
 * Every real project migration, oldest first. Version 1 is the first format,
 * so the list is empty. Adding version 2 = append one Migration here + a test.
 */
export const projectMigrations: Migration[] = []

export class ProjectTooNewError extends Error {
  constructor(found: number) {
    super(`This project was saved by a newer Blocksy (format ${found}). Update Blocksy to open it.`)
  }
}

/** Runs migrations until the data reaches `target`. Returns the data and what ran. */
export function runMigrations(
  data: Record<string, unknown>,
  migrations: Migration[],
  target: number,
): { data: Record<string, unknown>; applied: string[] } {
  let version = typeof data.formatVersion === "number" ? data.formatVersion : 0
  if (version > target) throw new ProjectTooNewError(version)

  const applied: string[] = []
  while (version < target) {
    const step = migrations.find((m) => m.from === version)
    if (!step) throw new Error(`No migration from project format ${version}`)
    data = { ...step.migrate(data), formatVersion: step.to }
    applied.push(step.describe)
    version = step.to
  }
  return { data, applied }
}

/** Reads a `blocksy.json` string: migrate to the current format, then validate. */
export function loadProject(json: string): { project: Project; applied: string[] } {
  const raw = JSON.parse(json) as Record<string, unknown>
  const { data, applied } = runMigrations(raw, projectMigrations, CURRENT_FORMAT_VERSION)
  return { project: projectSchema.parse(data), applied }
}

/** Writes a project as stable, readable JSON (2-space indent, trailing newline). */
export function serializeProject(project: Project): string {
  return `${JSON.stringify(project, null, 2)}\n`
}
