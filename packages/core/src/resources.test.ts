// Typed imports: GUI textures, particle textures, sounds and models. Every kind gets a good file,
// a wrong format, a too-big file and a bad name; the commands are checked for undo.
import { describe, expect, it } from "vitest"
import { createDocumentStore } from "./commands.ts"
import { createProject, projectSchema } from "./project.ts"
import { addResource, removeResource, resourceNameFromFile, resourcePlace, uniqueResourceName, validateResource } from "./resources.ts"

/** The first bytes of a PNG: signature, then an IHDR chunk with the size. */
function png(width: number, height: number, extra = 0): Uint8Array {
  const bytes = new Uint8Array(33 + extra)
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52])
  const view = new DataView(bytes.buffer)
  view.setUint32(16, width)
  view.setUint32(20, height)
  return bytes
}
const ascii = (s: string) => Uint8Array.from(s, (c) => c.charCodeAt(0))
const text = (value: unknown) => ascii(typeof value === "string" ? value : JSON.stringify(value))
/** An Ogg page whose first packet is a Vorbis identification header. */
const ogg = (extra = 0) => {
  const bytes = new Uint8Array(64 + extra)
  bytes.set(ascii("OggS"))
  bytes.set([0x01, ...ascii("vorbis")], 28)
  return bytes
}
const fail = (result: ReturnType<typeof validateResource>) => (result.ok ? "ok" : result.error)

describe("GUI texture import", () => {
  it("accepts a PNG up to 1024 pixels and names it from the file", () => {
    expect(validateResource("gui-texture", "Furnace Screen.PNG", png(256, 256))).toEqual({ ok: true, name: "furnace_screen", ext: "png" })
  })
  it("rejects other formats, fake PNGs, huge pictures and big files", () => {
    expect(fail(validateResource("gui-texture", "a.jpg", png(16, 16)))).toMatch(/must be a \.png/)
    expect(fail(validateResource("gui-texture", "a.png", text("not a picture, just text"))) ).toBe("That is not a PNG picture")
    expect(fail(validateResource("gui-texture", "a.png", png(2048, 16)))).toMatch(/at most 1024×1024/)
    expect(fail(validateResource("gui-texture", "a.png", png(16, 16, 600 * 1024)))).toMatch(/too big/)
  })
})

describe("particle texture import", () => {
  it("accepts small PNGs only", () => {
    expect(validateResource("particle-texture", "spark.png", png(16, 16)).ok).toBe(true)
    expect(fail(validateResource("particle-texture", "spark.png", png(512, 512)))).toMatch(/at most 256×256/)
    expect(fail(validateResource("particle-texture", "spark.png", png(16, 16, 100 * 1024)))).toMatch(/too big/)
  })
})

describe("sound import", () => {
  it("accepts Ogg Vorbis", () => {
    expect(validateResource("sound", "Cool Sound!.ogg", ogg())).toEqual({ ok: true, name: "cool_sound", ext: "ogg" })
  })
  it("rejects mp3 names, wav bytes in an .ogg, empty and huge files", () => {
    expect(fail(validateResource("sound", "a.mp3", ogg()))).toMatch(/must be a \.ogg/)
    expect(fail(validateResource("sound", "a.ogg", text("RIFF....WAVEfmt ")))).toMatch(/not an Ogg Vorbis/)
    expect(fail(validateResource("sound", "a.ogg", new Uint8Array(0)))).toBe("That file is empty")
    expect(fail(validateResource("sound", "a.ogg", ogg(3 * 1024 * 1024)))).toMatch(/too big/)
  })
})

describe("model import", () => {
  it("accepts a Minecraft model JSON and a Blockbench .bbmodel", () => {
    expect(validateResource("model", "Ruby Lamp.json", text({ elements: [] }))).toEqual({ ok: true, name: "ruby_lamp", ext: "json" })
    expect(validateResource("model", "child.json", text({ parent: "block/cube_all" })).ok).toBe(true)
    expect(validateResource("model", "lamp.bbmodel", text({ meta: { format_version: "4.10" }, elements: [] }))).toEqual({ ok: true, name: "lamp", ext: "bbmodel" })
  })
  it("rejects broken JSON, empty models and non-Blockbench files", () => {
    expect(fail(validateResource("model", "a.json", text("{ nope")))).toMatch(/not valid JSON/)
    expect(fail(validateResource("model", "a.json", text({ hello: 1 })))).toMatch(/no elements and no parent/)
    expect(fail(validateResource("model", "a.bbmodel", text({ elements: [] })))).toMatch(/not a Blockbench model/)
    expect(fail(validateResource("model", "a.obj", text("v 0 0 0")))).toMatch(/\.json or \.bbmodel/)
  })
})

describe("names", () => {
  it("makes safe names, and refuses files with nothing usable", () => {
    expect(resourceNameFromFile("C:\\Users\\me\\My Ünïcode.File.png")).toBe("my_unicode_file")
    expect(fail(validateResource("gui-texture", "✨.png", png(16, 16)))).toMatch(/Rename the file/)
  })
  it("adds _2 when the name is taken in the same kind only", () => {
    const store = createDocumentStore(createProject({ name: "T", target: "fabric", minecraftVersion: "26.1.2" }))
    store.execute(addResource({ kind: "sound", name: "pop", ext: "ogg", data: "AA==" }))
    expect(uniqueResourceName(store.get(), "sound", "pop")).toBe("pop_2")
    expect(uniqueResourceName(store.get(), "gui-texture", "pop")).toBe("pop")
  })
})

describe("where files land", () => {
  const base = { name: "x", data: "AA==" } as const
  it("uses the standard Minecraft folders", () => {
    expect(resourcePlace({ ...base, kind: "gui-texture", ext: "png" })).toEqual({ root: "assets", path: "textures/gui/x.png" })
    expect(resourcePlace({ ...base, kind: "particle-texture", ext: "png" })).toEqual({ root: "assets", path: "textures/particle/x.png" })
    expect(resourcePlace({ ...base, kind: "sound", ext: "ogg" })).toEqual({ root: "assets", path: "sounds/x.ogg" })
    expect(resourcePlace({ ...base, kind: "model", ext: "json" })).toEqual({ root: "assets", path: "models/imported/x.json" })
    expect(resourcePlace({ ...base, kind: "model", ext: "bbmodel" })).toEqual({ root: "project", path: "blockbench/x.bbmodel" })
  })
})

describe("import commands", () => {
  it("add and remove with undo and redo, and the project stays valid", () => {
    const store = createDocumentStore(createProject({ name: "T", target: "fabric", minecraftVersion: "26.1.2" }))
    expect(store.get().resources).toBeUndefined() // old projects have none: no format change needed
    store.execute(addResource({ kind: "sound", name: "pop", ext: "ogg", data: "AA==" }))
    expect(store.get().resources).toHaveLength(1)
    expect(projectSchema.safeParse(store.get()).success).toBe(true)
    expect(store.undoLabel()).toBe("Import pop")
    store.execute(removeResource("sound", "pop"))
    expect(store.get().resources).toHaveLength(0)
    store.undo()
    expect(store.get().resources).toHaveLength(1)
    store.undo()
    expect(store.get().resources).toBeUndefined()
  })
  it("the schema rejects a bad name", () => {
    const project = { ...createProject({ name: "T", target: "fabric", minecraftVersion: "26.1.2" }), resources: [{ kind: "sound", name: "Bad Name", ext: "ogg", data: "AA==" }] }
    expect(projectSchema.safeParse(project).success).toBe(false)
  })
})
