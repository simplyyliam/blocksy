// The Creative tab's editor panel and canvas.
// The canvas is a calm sketch of a creative inventory page (Blocksy's own drawing,
// not Minecraft's GUI art): the tab on top, its blocks in a 9-wide slot grid.
import type { ElementEditorProps } from "@blocksy/core"
import { elementToMcItem } from "@blocksy/game-data"
import {
  Button, Input, InspectorField, InspectorSection, McScreen, McStage, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  type McSlotRect,
} from "@blocksy/ui"
import { tabEntries, type CreativeTabData } from "./element.ts"

/** "First block" in the icon select. "@" can't start an element id, so no block collides. */
const AUTO_ICON = "@auto"

/** v0.3: the order the game shows them in: blocks first, then items (as the targets write it). */
const inGameOrder = <T extends { type: string }>(list: T[]) => [...list.filter((e) => e.type === "block"), ...list.filter((e) => e.type !== "block")]

const textureOf = (data: unknown) => {
  const texture = (data as { texture?: unknown } | null)?.texture
  return typeof texture === "string" ? `data:image/png;base64,${texture}` : null
}

export function CreativeTabInspector({ element, project, change, rename, select }: ElementEditorProps<CreativeTabData>) {
  const entries = inGameOrder(tabEntries(project, element.id))
  return (
    <div className="flex flex-col divide-y divide-line-subtle py-1">
      <InspectorSection title="Creative tab">
        <InspectorField label="Title" java={`"itemGroup.${project.modId}.${element.id}"`}>
          {(id) => (
            <Input
              id={id}
              key={element.name}
              defaultValue={element.name}
              spellCheck={false}
              className="h-8"
              onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== element.name && rename(e.target.value.trim())}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            />
          )}
        </InspectorField>
        <InspectorField label="Icon">
          {(id) => (
            <Select
              items={[{ value: AUTO_ICON, label: "First in tab" }, ...entries.map((e) => ({ value: e.id, label: e.name }))]}
              value={element.data.icon ?? AUTO_ICON}
              onValueChange={(v) => v !== null && change({ icon: v === AUTO_ICON ? null : v })}
            >
              <SelectTrigger id={id} size="sm" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectItem value={AUTO_ICON}>First in tab</SelectItem>
                {entries.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </InspectorField>
      </InspectorSection>
      <InspectorSection title={`Contents · ${entries.length}`}>
        {entries.length === 0 && <p className="text-xs text-fg-muted">Empty. Pick this tab in a block's inspector (Creative tab → Shows in).</p>}
        <div className="flex flex-col gap-0.5">
          {entries.map((e) => (
            <Button key={e.id} variant="ghost" size="sm" className="justify-start gap-2 px-1.5" onClick={() => select(e.id)}>
              {textureOf(e.data) ? (
                <img src={textureOf(e.data)!} alt="" className="size-4 object-cover object-top [image-rendering:pixelated]" />
              ) : (
                <span className="size-4 rounded-xs bg-surface-pressed" />
              )}
              <span className="truncate">{e.name}</span>
            </Button>
          ))}
        </div>
      </InspectorSection>
    </div>
  )
}

/** Other tabs of the creative screen, only for company: a plausible icon each (vanilla art, drawn from the game's files). */
const OTHER_TAB_ICONS = ["minecraft:bricks", "minecraft:grass_block", "minecraft:wooden_sword", "minecraft:redstone", "minecraft:apple", "minecraft:compass"]

// The game's creative inventory, in its own pixels: 195 x 136 below a row of tabs.
const PANEL = { w: 195, h: 136, top: 28 }
const GRID = { x: 9, y: 18, cols: 9, rows: 5 }

export function CreativeTabCanvas({ element, project, select }: ElementEditorProps<CreativeTabData>) {
  const entries = inGameOrder(tabEntries(project, element.id))
  const icon = entries.find((e) => e.id === element.data.icon) ?? entries[0]
  const shown = entries.slice(0, GRID.cols * GRID.rows)
  const slots: McSlotRect[] = shown.map((entry, i) => ({
    key: entry.id,
    label: entry.name,
    x: GRID.x + (i % GRID.cols) * 18,
    y: PANEL.top + GRID.y + Math.floor(i / GRID.cols) * 18,
  }))

  return (
    <McStage hint={entries.length > shown.length ? `Showing the first ${shown.length} of ${entries.length}. The game scrolls the rest.` : "How the tab looks in the creative inventory. Click an item or block to edit it."}>
      {(scale) => (
        <McScreen
          label="Creative inventory"
          width={PANEL.w}
          height={PANEL.top + PANEL.h}
          scale={scale}
          needs={{
            gui: ["container/creative_inventory/tab_items"],
            sprites: [
              "container/creative_inventory/tab_top_selected_1",
              "container/creative_inventory/scroller_disabled",
              ...OTHER_TAB_ICONS.map((_, i) => `container/creative_inventory/tab_top_unselected_${i + 2}`),
            ],
            items: OTHER_TAB_ICONS,
            font: true,
          }}
          slots={slots}
          onSlot={(key) => select(key)}
          draw={(g) => {
            g.gui("container/creative_inventory/tab_items", 0, 0, PANEL.w, PANEL.h, 0, PANEL.top)
            // Tabs: ours is the selected one (first), the rest are the game's.
            g.sprite("container/creative_inventory/tab_top_selected_1", 0, 0, 26, 32)
            g.item(icon ? elementToMcItem(icon) : { vanilla: "minecraft:barrier" }, 5, 9)
            OTHER_TAB_ICONS.forEach((id, i) => {
              g.sprite(`container/creative_inventory/tab_top_unselected_${i + 2}`, 27 * (i + 1), 0, 26, 32)
              g.item({ vanilla: id }, 27 * (i + 1) + 5, 9)
            })
            g.text(element.name, 8, PANEL.top + 6, "#404040", false)
            g.sprite("container/creative_inventory/scroller_disabled", 175, PANEL.top + 18, 12, 15)
            shown.forEach((entry, i) => g.item(elementToMcItem(entry), GRID.x + (i % GRID.cols) * 18 + 1, PANEL.top + GRID.y + Math.floor(i / GRID.cols) * 18 + 1))
          }}
        />
      )}
    </McStage>
  )
}
