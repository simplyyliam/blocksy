// The Recipe's canvas: the game's own crafting table, furnace, blast furnace, smoker or
// stonecutter screen, drawn from Minecraft's files (ADR 0011), with your ingredients in it.
//
//   ( Shaped  Shapeless  Smelting  Blasting  Smoking  Stonecutting )
//
//   ┌ the real screen, at GUI scale 1-4 ───────────┐
//   │ Furnace                                      │
//   │  [ingredient]   ▶ progress arrow   [result]  │
//   └──────────────────────────────────────────────┘
//
// Click a slot to pick an item or tag; Delete, Backspace or right-click empties it. Every change
// is one undo step. Numbers (cooking time, experience) live in the inspector, not here.
import type { ElementEditorProps } from "@blocksy/core"
import { ItemPicker, refLabel, resolveRef, slotPicture, vanillaIds, type SlotPicture } from "@blocksy/game-data"
import { McScreen, McStage, Tabs, TabsList, TabsTrigger, type McGraphics, type McSlotRect } from "@blocksy/ui"
import { changeKind, isCooking, isCrafting, RECIPE_KINDS, recipeProblems, type RecipeData, type RecipeKind } from "./schema.ts"

const KIND_LABELS: Record<RecipeKind, string> = {
  shaped: "Shaped",
  shapeless: "Shapeless",
  smelting: "Smelting",
  blasting: "Blasting",
  smoking: "Smoking",
  stonecutting: "Stonecutting",
}

const STATION: Record<RecipeKind, string> = {
  shaped: "Crafting table",
  shapeless: "Crafting table",
  smelting: "Furnace",
  blasting: "Blast furnace",
  smoking: "Smoker",
  stonecutting: "Stonecutter",
}

interface Layout {
  /** The full GUI picture below textures/gui (176 x 166). */
  gui: string
  title: string
  /** Title x in GUI pixels; null centers it (furnaces do). */
  titleX: number | null
  /** Where the picture of each slot's item goes (the slot box is one pixel bigger). */
  slots: { key: string; x: number; y: number; label: string }[]
  /** Sprites to draw on top (the cooking arrow and flame). */
  sprites: { id: string; x: number; y: number; w: number; h: number }[]
}

const SCREEN = { w: 176, h: 166 }

function layoutFor(kind: RecipeKind): Layout {
  if (isCrafting(kind)) {
    return {
      gui: "container/crafting_table",
      title: "Crafting",
      titleX: 28,
      slots: [
        ...Array.from({ length: 9 }, (_, i) => ({ key: `grid-${i}`, x: 30 + (i % 3) * 18, y: 17 + Math.floor(i / 3) * 18, label: `Slot ${i + 1}` })),
        { key: "result", x: 124, y: 35, label: "Result" },
      ],
      sprites: [],
    }
  }
  if (kind === "stonecutting") {
    return {
      gui: "container/stonecutter",
      title: "Stonecutter",
      titleX: 8,
      slots: [
        { key: "ingredient", x: 20, y: 33, label: "Ingredient" },
        { key: "result", x: 143, y: 33, label: "Result" },
      ],
      sprites: [],
    }
  }
  // Furnace, blast furnace and smoker share one layout and each has its own pictures.
  const name = kind === "blasting" ? "blast_furnace" : kind === "smoking" ? "smoker" : "furnace"
  return {
    gui: `container/${name}`,
    title: STATION[kind],
    titleX: null,
    slots: [
      { key: "ingredient", x: 56, y: 17, label: "Ingredient" },
      { key: "result", x: 116, y: 35, label: "Result" },
    ],
    sprites: [
      { id: `container/${name}/lit_progress`, x: 56, y: 36, w: 14, h: 14 },
      { id: `container/${name}/burn_progress`, x: 79, y: 34, w: 24, h: 16 },
    ],
  }
}

/** The ref a slot key holds, and how to write a new one. */
function slotRef(data: RecipeData, key: string): string | null {
  if (key === "result") return data.result
  if (key === "ingredient") return data.ingredient
  return data.grid[Number(key.slice(5))] ?? null
}

function writeSlot(data: RecipeData, key: string, ref: string | null): RecipeData {
  if (key === "result") return { ...data, result: ref }
  if (key === "ingredient") return { ...data, ingredient: ref }
  const index = Number(key.slice(5))
  return { ...data, grid: data.grid.map((s, i) => (i === index ? ref : s)) }
}

export function RecipeCanvas({ element, project, change }: ElementEditorProps<RecipeData>) {
  const data = element.data
  const layout = layoutFor(data.kind)
  const problems = recipeProblems(data, (ref) => resolveRef(ref, project) !== null)
  const pictures = new Map<string, SlotPicture>(layout.slots.map((s) => [s.key, slotPicture(slotRef(data, s.key), project)]))
  const rects: McSlotRect[] = layout.slots.map((s) => ({ key: s.key, x: s.x - 1, y: s.y - 1, label: `${s.label}: ${slotRef(data, s.key) ? refLabel(slotRef(data, s.key)!, project) : "empty"}` }))

  const draw = (g: McGraphics) => {
    g.gui(layout.gui, 0, 0, SCREEN.w, SCREEN.h, 0, 0)
    for (const sprite of layout.sprites) g.sprite(sprite.id, sprite.x, sprite.y, sprite.w, sprite.h)
    const titleX = layout.titleX ?? Math.round((SCREEN.w - g.measure(layout.title)) / 2)
    g.text(layout.title, titleX, 6, "#404040", false)
    g.text("Inventory", 8, 72, "#404040", false)
    for (const slot of layout.slots) {
      const picture = pictures.get(slot.key)
      if (picture?.kind === "item") g.item(picture.item, slot.x, slot.y)
      if (picture?.kind === "tag") g.text("#", slot.x + 5, slot.y + 4, "#9a9a9a", true)
    }
    // The stack size, as the game draws it in the corner of the result slot.
    const result = layout.slots.find((s) => s.key === "result")!
    if (data.count > 1 && pictures.get("result")?.kind === "item") {
      const label = String(data.count)
      g.text(label, result.x + 17 - g.measure(label), result.y + 9, "#ffffff", true)
    }
  }

  return (
    <McStage
      hint={
        problems.length > 0
          ? `${problems[0]}. Until then this recipe isn't built.`
          : `${STATION[data.kind]}: ${data.kind === "shapeless" ? "any arrangement works" : data.kind === "shaped" ? "the pattern counts, empty edges are trimmed" : "one in, one out"}. Click a slot to pick; Delete or right-click empties it.`
      }
    >
      {(scale) => (
        <div className="flex flex-col items-center gap-4">
          <Tabs value={data.kind} onValueChange={(v) => v && change(changeKind(data, v as RecipeKind))}>
            <TabsList className="h-7 max-w-full overflow-x-auto bg-bg/90 shadow-sm backdrop-blur-md">
              {RECIPE_KINDS.map((kind) => (
                <TabsTrigger key={kind} value={kind} className="h-5.5 px-2 text-xs">
                  {KIND_LABELS[kind]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <McScreen
            label={`${STATION[data.kind]} screen`}
            width={SCREEN.w}
            height={SCREEN.h}
            scale={scale}
            needs={{
              gui: [layout.gui],
              sprites: layout.sprites.map((s) => s.id),
              items: vanillaIds([...pictures.values()]),
              font: true,
            }}
            slots={rects}
            draw={draw}
            onSlotClear={(key) => change(writeSlot(data, key, null))}
            wrapSlot={(slot, button) => (
              <ItemPicker
                project={project}
                allowTags={slot.key !== "result"}
                onPick={(ref) => change(writeSlot(data, slot.key, ref))}
                trigger={button}
              />
            )}
          />
          {isCooking(data.kind) && <p className="text-xs text-fg-muted tabular-nums">Cooks in {data.cookingTime / 20}s</p>}
        </div>
      )}
    </McStage>
  )
}
