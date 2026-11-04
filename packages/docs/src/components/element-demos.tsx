// Live demos for the v0.3 elements: the real editor canvases in a sandbox (plan 11.2).
// Each demo keeps its own little project in React state, so poking it never touches a
// real project. Same components as the project editor, so the docs can't drift.
import { useState, type ComponentType } from "react"
import { createProject, type ElementEditorProps, type ElementType, type Project } from "@blocksy/core"
import { berryBunTexture, berryDoughTexture, foodDefaults, itemDefaults, itemElement } from "@blocksy/element-item"
import { LanguageCanvas } from "@blocksy/element-language"
import { RecipeCanvas, recipeDefaults } from "@blocksy/element-recipe"
import { TagCanvas } from "@blocksy/element-tag"
import { TextureEditor, type TextureValue } from "@blocksy/pixel"

/** A small mod for the demos: dough, bun, a recipe, a tag and a German table. */
function sandboxProject(): Project {
  const bun = berryBunTexture()
  return {
    ...createProject({ name: "Demo Mod", target: "fabric", minecraftVersion: "26.1.2" }),
    elements: [
      { id: "berry_dough", type: "item", name: "Berry Dough", data: { ...itemDefaults(), texture: berryDoughTexture() } },
      { id: "berry_bun", type: "item", name: "Berry Bun", data: { ...itemDefaults(), texture: bun.png, animation: { frametime: 8, interpolate: false }, food: foodDefaults() } },
      { id: "berry_bun_recipe", type: "recipe", name: "Berry Bun", data: { ...recipeDefaults(), kind: "smelting", ingredient: "berry_dough", result: "berry_bun", category: "food" } },
      { id: "fruits", type: "tag", name: "Fruits", data: { registry: "item", target: null, values: ["minecraft:apple", "minecraft:sweet_berries", "berry_bun"] } },
      { id: "german", type: "language", name: "German", data: { locale: "de_de", entries: { "item.demo_mod.berry_bun": "Beerenbrötchen" } } },
    ],
  }
}

function Frame({ children, caption, height = "h-96" }: { children: React.ReactNode; caption: string; height?: string }) {
  return (
    <figure className="not-prose my-6">
      <div className={`relative ${height} overflow-hidden rounded-xl bg-fd-muted`}>{children}</div>
      <figcaption className="mt-2 text-center text-xs text-fd-muted-foreground">{caption}</figcaption>
    </figure>
  )
}

/** Runs an element's real canvas on the sandbox project. */
function Sandbox({ elementId, Canvas, caption }: { elementId: string; Canvas: ComponentType<ElementEditorProps<never>>; caption: string }) {
  const [project, setProject] = useState(sandboxProject)
  const element = project.elements.find((e) => e.id === elementId)!
  const change = (data: unknown) => setProject((p) => ({ ...p, elements: p.elements.map((e) => (e.id === elementId ? { ...e, data } : e)) }))
  return (
    <Frame caption={caption}>
      <Canvas element={element as never} project={project} change={change} rename={() => {}} select={() => {}} elementTypes={[itemElement as ElementType]} />
    </Frame>
  )
}

/** The pixel texture editor with the starter bun (two frames). Paint away. */
export function TextureDemo({ caption = "The real texture editor. Paint, fill, mirror, add frames: nothing here is saved." }: { caption?: string }) {
  const [value, setValue] = useState<TextureValue>(() => {
    const bun = berryBunTexture()
    return { png: bun.png, animation: { frametime: 8, interpolate: false } }
  })
  return (
    <Frame caption={caption} height="h-[30rem]">
      <TextureEditor value={value} onChange={setValue} className="absolute inset-0" />
    </Frame>
  )
}

export const RecipeDemo = ({ caption = "The real recipe editor. Switch kinds, click a slot to pick an item." }: { caption?: string }) => (
  <Sandbox elementId="berry_bun_recipe" Canvas={RecipeCanvas as never} caption={caption} />
)

export const TagDemo = ({ caption = "A tag of fruits. Add or remove entries; recipes can ask for #fruits." }: { caption?: string }) => (
  <Sandbox elementId="fruits" Canvas={TagCanvas as never} caption={caption} />
)

export const LanguageDemo = ({ caption = "The lang editor: every key the mod makes, its English text, and the German translation." }: { caption?: string }) => (
  <Sandbox elementId="german" Canvas={LanguageCanvas as never} caption={caption} />
)

/** Demos by element type id, for the generated Reference pages. */
export const ELEMENT_DEMOS: Record<string, ComponentType> = {
  item: () => <TextureDemo caption="An item's canvas is its texture. This is the real editor: paint away." />,
  recipe: () => <RecipeDemo />,
  tag: () => <TagDemo />,
  language: () => <LanguageDemo />,
}
