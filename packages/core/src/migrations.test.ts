import { describe, expect, it } from "vitest"
import { loadProject, runMigrations, serializeProject, type Migration } from "./migrations.ts"
import { createProject } from "./project.ts"

// Fake migrations prove the runner itself. Each real migration gets its own test.
const fake: Migration[] = [
  { from: 1, to: 2, describe: "Rename title to name", migrate: ({ title, ...rest }) => ({ ...rest, name: title }) },
  { from: 2, to: 3, describe: "Add tags", migrate: (d) => ({ ...d, tags: [] }) },
]

describe("migrations", () => {
  it("runs every step in order up to the target version", () => {
    const { data, applied } = runMigrations({ formatVersion: 1, title: "Old" }, fake, 3)
    expect(data).toEqual({ formatVersion: 3, name: "Old", tags: [] })
    expect(applied).toEqual(["Rename title to name", "Add tags"])
  })

  it("leaves current data alone", () => {
    expect(runMigrations({ formatVersion: 3 }, fake, 3).applied).toEqual([])
  })

  it("refuses files from a newer Blocksy, and gaps in the chain", () => {
    expect(() => runMigrations({ formatVersion: 4 }, fake, 3)).toThrow(/newer Blocksy/)
    expect(() => runMigrations({ formatVersion: 0 }, fake, 3)).toThrow(/No migration from project format 0/)
  })

  it("round-trips a project through blocksy.json", () => {
    const project = createProject({ name: "Round Trip", target: "fabric", minecraftVersion: "26.1.2" })
    expect(loadProject(serializeProject(project)).project).toEqual(project)
  })
})
