// The Item's canvas. Two modes (the mode bar above the canvas picks one):
//   Paint  the paint studio: zoom, layers, frames, colour picker, live preview (@blocksy/pixel)
//   Look   the item as the game shows it: in an inventory slot, its tooltip, the hotbar
// Painting commits through `change`, so every stroke is one undo step.
import type { ElementEditorProps } from "@blocksy/core"
import { elementToMcItem } from "@blocksy/game-data"
import { PaintStudio } from "@blocksy/pixel"
import { CanvasBackdrop, McScreen, McStage } from "@blocksy/ui"
import { RARITIES } from "./options.ts"
import { TEXTURE_SIZE, type ItemData } from "./schema.ts"

/** Tooltip colours the game uses per rarity (common is white). */
const RARITY_COLOR: Record<string, string> = { common: "#ffffff", uncommon: "#ffff55", rare: "#55ffff", epic: "#ff55ff" }

const W = 182
const H = 110

function ItemLook({ element }: ElementEditorProps<ItemData>) {
  const data = element.data
  const item = elementToMcItem(element)
  const lines = [element.name, ...data.tooltip.filter((l) => l.trim() !== "")]
  const rarity = RARITIES.find((r) => r.id === data.rarity)?.id ?? "common"
  return (
    <McStage hint="How the item looks in the game: in a slot, its tooltip, and in the hotbar. Paint it in Paint mode.">
      {(scale) => (
        <McScreen
          label="Item in the game"
          width={W}
          height={H}
          scale={scale}
          needs={{
            sprites: ["container/slot", "tooltip/background", "tooltip/frame", "hud/hotbar", "hud/hotbar_selection"],
            font: true,
          }}
          draw={(g) => {
            // A slot with the item, and the tooltip beside it. The game draws the tooltip box
            // 12px outside the text (3px padding plus its 9px border), so leave room for that.
            g.sprite("container/slot", 8, 26, 18, 18)
            g.item(item, 9, 27)
            const textX = 52
            const textY = 29
            const textW = Math.max(...lines.map((l) => g.measure(l)))
            const textH = 8 + (lines.length - 1) * 10 + (lines.length > 1 ? 2 : 0)
            g.sprite("tooltip/background", textX - 12, textY - 12, textW + 24, textH + 24)
            g.sprite("tooltip/frame", textX - 12, textY - 12, textW + 24, textH + 24)
            lines.forEach((line, i) => g.text(line, textX, textY + i * 10 + (i > 0 ? 2 : 0), i === 0 ? RARITY_COLOR[rarity] : "#aaaaaa", true))
            // The hotbar, with the item in the selected slot.
            g.sprite("hud/hotbar", 0, H - 22, 182, 22)
            g.sprite("hud/hotbar_selection", -1, H - 23, 24, 24)
            g.item(item, 3, H - 19)
          }}
        />
      )}
    </McStage>
  )
}

export function ItemCanvas(props: ElementEditorProps<ItemData>) {
  const { element, change, mode } = props
  const data = element.data
  if (mode === "look") return <ItemLook {...props} />
  return (
    <div className="relative size-full">
      <CanvasBackdrop />
      <PaintStudio
        kind="item"
        size={TEXTURE_SIZE}
        value={{ png: data.texture, animation: data.animation, layers: data.layers }}
        onChange={(v) => change({ ...data, texture: v.png, animation: v.animation, layers: v.layers ?? null })}
      />
    </div>
  )
}
