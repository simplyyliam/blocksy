import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import { addElement, createDocumentStore, createProject, createRegistries } from "@blocksy/core"
import { fabricTarget } from "@blocksy/target-fabric"
import { fileTree, generate } from "./index.ts"
import { dummyElement } from "./__fixtures__/dummy-element/index.ts"

// The same registries the app builds at startup, with just the Fabric target.
function setup() {
  const registries = createRegistries()
  registries.loaderTargets.register(fabricTarget)
  return registries
}

const emptyMod = () =>
  createProject({ name: "Aetheric Storage Engineering", target: "fabric", minecraftVersion: "26.1.2" })

describe("generator", () => {
  it("matches the golden files for an empty Fabric mod", async () => {
    // Golden files live in __golden__/: open them to see exactly what Blocksy writes.
    // After an intended template change, update them with: pnpm test -u
    for (const file of generate(emptyMod(), setup())) {
      if ("contents" in file) {
        await expect(file.contents).toMatchFileSnapshot(`./__golden__/empty-mod/${file.path}`)
      } else {
        // Binary files are checked by hash, so the golden folder stays readable.
        const hash = createHash("sha256").update(Buffer.from(file.base64, "base64")).digest("hex")
        await expect(`${hash}\n`).toMatchFileSnapshot(`./__golden__/empty-mod/${file.path}.sha256`)
      }
    }
  })

  it("is pure: the same project always gives byte-identical output", () => {
    expect(generate(emptyMod(), setup())).toEqual(generate(emptyMod(), setup()))
  })

  it("refuses projects it cannot build", () => {
    const project = { ...emptyMod(), minecraftVersion: "1.0" }
    expect(() => generate(project, setup())).toThrow(/no tested setup for Minecraft 1.0/)
  })

  it("draws the What gets created tree", () => {
    const tree = fileTree("aetheric_storage_engineering", generate(emptyMod(), setup()).map((f) => f.path))
    expect(tree).toMatchInlineSnapshot(`
      "aetheric_storage_engineering/
        .gitignore
        build.gradle
        gradle.properties
        gradlew
        gradlew.bat
        settings.gradle
        gradle/wrapper/
          gradle-wrapper.jar
          gradle-wrapper.properties
        src/
          client/java/com/example/aetheric_storage_engineering/client/
            AethericStorageEngineeringClient.java
          main/
            java/com/example/aetheric_storage_engineering/
              AethericStorageEngineering.java
            resources/
              fabric.mod.json
              assets/aetheric_storage_engineering/lang/
                en_us.json"
    `)
  })
})

describe("adding an element type", () => {
  it("needs only one folder plus one registration line", () => {
    const registries = setup()
    registries.elementTypes.register(dummyElement) // <- the one registration line

    // Nothing else changed, yet the project accepts, edits and generates the new type.
    const store = createDocumentStore(emptyMod())
    store.execute(addElement({ id: "first", type: "dummy", name: "First", data: dummyElement.defaults() }))
    const files = generate(store.get(), registries)

    const dummy = files.find((f) => f.path.endsWith("dummy/first.json"))
    expect(dummy).toEqual({
      path: "src/main/resources/assets/aetheric_storage_engineering/dummy/first.json",
      contents: '{"greeting":"Hello"}\n',
    })
  })

  it("rejects element data its schema does not allow", () => {
    const registries = setup()
    registries.elementTypes.register(dummyElement)
    const project = { ...emptyMod(), elements: [{ id: "x", type: "dummy", name: "Broken", data: { greeting: "" } }] }
    expect(() => generate(project, registries)).toThrow(/Broken/)
  })
})
