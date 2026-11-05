import { describe, expect, it } from "vitest"
import { indexMatches, makeIndex, parseIndex, withIgnoreEntry } from "./workspace-index"

const files = { clientJar: "C:/g/fabric-loom/26.1.2/minecraft-client.jar", assetIndex: "C:/g/a/26.1.2-30.json", assetObjects: "C:/g/a/objects", loaderJars: ["C:/g/loader.jar"] }

describe("workspace index", () => {
  it("round-trips through JSON", () => {
    const index = makeIndex("26.1.2", "fabric", files)
    expect(parseIndex(JSON.stringify(index))).toEqual(index)
  })

  it("rejects broken or foreign files so they get rebuilt", () => {
    expect(parseIndex("not json")).toBeNull()
    expect(parseIndex(JSON.stringify({ formatVersion: 99, minecraft: "26.1.2", loader: "fabric" }))).toBeNull()
    expect(parseIndex(JSON.stringify({ formatVersion: 1, loader: "fabric" }))).toBeNull()
  })

  it("is stale when the Minecraft version changes or the jar is missing", () => {
    const index = makeIndex("26.1.2", "fabric", files)
    expect(indexMatches(index, "26.1.2", "fabric")).toBe(true)
    expect(indexMatches(index, "26.3", "fabric")).toBe(false)
    expect(indexMatches({ ...index, clientJar: null }, "26.1.2", "fabric")).toBe(false)
  })
})

describe("gitignore entry", () => {
  it("adds .blocksy/ to an existing file once", () => {
    const next = withIgnoreEntry(".gradle/\nbuild/\n")!
    expect(next).toContain("\n.blocksy/\n")
    expect(withIgnoreEntry(next)).toBeNull()
  })

  it("creates the file content when there is none, and handles a missing final newline", () => {
    expect(withIgnoreEntry(null)).toContain(".blocksy/")
    expect(withIgnoreEntry("build/")).toBe("build/\n\n# Blocksy: paths into this computer's Gradle cache (never commit or share)\n.blocksy/\n")
  })

  it("leaves a file alone that already ignores the folder", () => {
    expect(withIgnoreEntry("a\n.blocksy\n")).toBeNull()
  })
})
