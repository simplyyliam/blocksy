// Imported resources become files in the mod: right folder, bytes untouched, sounds registered.
import { describe, expect, it } from "vitest"
import { addResource, createDocumentStore, createProject, createRegistries } from "@blocksy/core"
import { fabricTarget } from "@blocksy/target-fabric"
import { generate } from "./index.ts"

const registries = () => {
  const r = createRegistries()
  r.loaderTargets.register(fabricTarget)
  return r
}

function modWith(...resources: Parameters<typeof addResource>[0][]) {
  const store = createDocumentStore(createProject({ name: "Res Mod", modId: "res_mod", target: "fabric", minecraftVersion: "26.1.2" }))
  for (const resource of resources) store.execute(addResource(resource))
  return store.get()
}

describe("generated resources", () => {
  const files = generate(
    modWith(
      { kind: "gui-texture", name: "screen", ext: "png", data: "R1VJ" },
      { kind: "particle-texture", name: "spark", ext: "png", data: "U1A=" },
      { kind: "sound", name: "pop", ext: "ogg", data: "T0dH" },
      { kind: "sound", name: "boom", ext: "ogg", data: "T0dH" },
      { kind: "model", name: "lamp", ext: "json", data: "e30=" },
      { kind: "model", name: "lamp", ext: "bbmodel", data: "e30=" },
    ),
    registries(),
  )
  const at = (path: string) => files.find((f) => f.path === path)
  const assets = "src/main/resources/assets/res_mod"

  it("writes each file into its folder with the bytes unchanged", () => {
    expect(at(`${assets}/textures/gui/screen.png`)).toMatchObject({ base64: "R1VJ" })
    expect(at(`${assets}/textures/particle/spark.png`)).toMatchObject({ base64: "U1A=" })
    expect(at(`${assets}/sounds/pop.ogg`)).toMatchObject({ base64: "T0dH" })
    expect(at(`${assets}/models/imported/lamp.json`)).toMatchObject({ base64: "e30=" })
  })
  it("keeps Blockbench sources outside the mod's assets", () => {
    expect(at("blockbench/lamp.bbmodel")).toMatchObject({ base64: "e30=" })
  })
  it("registers sounds in sounds.json, in a stable order", () => {
    const json = JSON.parse((at(`${assets}/sounds.json`) as { contents: string }).contents)
    expect(Object.keys(json)).toEqual(["boom", "pop"])
    expect(json.pop).toEqual({ sounds: ["res_mod:pop"] })
  })
  it("adds nothing for a mod without resources, and is pure", () => {
    expect(generate(modWith(), registries()).some((f) => f.path.includes("sounds.json"))).toBe(false)
    expect(generate(modWith({ kind: "sound", name: "pop", ext: "ogg", data: "T0dH" }), registries())).toEqual(
      generate(modWith({ kind: "sound", name: "pop", ext: "ogg", data: "T0dH" }), registries()),
    )
  })
})
