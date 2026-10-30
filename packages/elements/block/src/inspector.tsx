// The Block's editor panel: the floating inspector on the right of the project editor.
// Every edit goes through `change` (a command), so it can be undone. Each field shows
// the Java it becomes, in small grey mono, so you learn the code while you click.
import { ImageUp, Trash2 } from "lucide-react"
import { useRef } from "react"
import type { ElementEditorProps } from "@blocksy/core"
import {
  Button, Input, InspectorField, InspectorSection, NumberInput, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Slider, Switch, toast,
} from "@blocksy/ui"
import { fieldDoc } from "./docs.ts"
import { MAP_COLORS, SOUNDS, STRENGTH_EXAMPLES, TOOL_TIERS, TOOLS } from "./options.ts"
import { pngDataUrl, pngSize } from "./png.ts"
import { TEXTURE_SIZE, type BlockData } from "./schema.ts"

/** The id of the Creative tab element type (its own package). Data references, not imports. */
const CREATIVE_TAB_TYPE = "creative_tab"

/** "No tab" in the select. "@" can't start an element id, so no tab can collide with it. */
const NO_TAB = "@none"

interface Choice {
  value: string
  label: string
}

/** A compact select over a fixed list of choices. */
function Choose({ id, value, items, onChange }: { id: string; value: string; items: Choice[]; onChange(v: string): void }) {
  return (
    <Select items={items} value={value} onValueChange={(v) => v !== null && onChange(v)}>
      <SelectTrigger id={id} size="sm" className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** Reads a picked file as base64 and checks it is a 16x16 PNG. */
async function readTexture(file: File): Promise<string> {
  const url = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
  const base64 = url.slice(url.indexOf(",") + 1)
  const size = pngSize(base64)
  if (!size) throw new Error("That file isn't a PNG image")
  if (size.width !== TEXTURE_SIZE || size.height !== TEXTURE_SIZE) {
    throw new Error(`That image is ${size.width}x${size.height}. Block textures are 16x16 pixels.`)
  }
  return base64
}

const fmt = (n: number) => (Number.isInteger(n) ? `${n}.0` : String(n))

export function BlockInspector({ element, project, change, rename, select }: ElementEditorProps<BlockData>) {
  const data = element.data
  const set = (patch: Partial<BlockData>) => change({ ...data, ...patch })
  const fileInput = useRef<HTMLInputElement>(null)

  const tabs = project.elements.filter((e) => e.type === CREATIVE_TAB_TYPE)
  const near = STRENGTH_EXAMPLES.reduce((a, b) => (Math.abs(b.hardness - data.hardness) < Math.abs(a.hardness - data.hardness) ? b : a))

  const importTexture = async (file: File | undefined) => {
    if (!file) return
    try {
      set({ texture: await readTexture(file) })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div className="flex flex-col divide-y divide-line-subtle py-1">
      <InspectorSection title="Block">
        <InspectorField label="Name" description={fieldDoc("name").description}>
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
        <InspectorField label="ID" description="Made from the first name. It never changes: worlds save blocks by id.">
          {() => (
            <code className="truncate font-mono text-xs text-fg-muted" data-selectable title={`${project.modId}:${element.id}`}>
              {project.modId}:{element.id}
            </code>
          )}
        </InspectorField>
      </InspectorSection>

      <InspectorSection title="Look">
        <InspectorField label="Texture" java={`textures/block/${element.id}.png`} description={fieldDoc("texture").description}>
          {(id) => (
            <div className="flex items-center gap-1.5">
              {data.texture && (
                <img
                  src={pngDataUrl(data.texture)}
                  alt=""
                  className="size-7 shrink-0 rounded-md [image-rendering:pixelated]"
                />
              )}
              <Button id={id} variant="secondary" size="sm" className="px-2.5" onClick={() => fileInput.current?.click()}>
                <ImageUp strokeWidth={1.75} /> {data.texture ? "Replace" : "Import"}
              </Button>
              {data.texture && (
                <Button variant="ghost" size="icon-sm" aria-label="Remove texture" title="Remove texture" onClick={() => set({ texture: null })}>
                  <Trash2 strokeWidth={1.75} />
                </Button>
              )}
              <input
                ref={fileInput}
                type="file"
                accept="image/png"
                hidden
                onChange={(e) => {
                  void importTexture(e.target.files?.[0])
                  e.target.value = "" // picking the same file again still triggers a change
                }}
              />
            </div>
          )}
        </InspectorField>
        <InspectorField label="Map colour" java={`.mapColor(MapColor.${data.mapColor.toUpperCase()})`} description={fieldDoc("mapColor").description}>
          {(id) => (
            <div className="flex w-full items-center gap-2">
              {/* The swatch shows Minecraft's own map colour value (game data). */}
              <span className="size-4 shrink-0 rounded-xs shadow-[inset_0_0_0_1px_var(--b-line)]" style={{ background: MAP_COLORS.find((c) => c.id === data.mapColor)?.rgb }} />
              <Choose id={id} value={data.mapColor} items={MAP_COLORS.map((c) => ({ value: c.id, label: c.label }))} onChange={(v) => set({ mapColor: v as BlockData["mapColor"] })} />
            </div>
          )}
        </InspectorField>
      </InspectorSection>

      <InspectorSection title="Mining">
        <InspectorField label="Hardness" java={`.strength(${fmt(data.hardness)}f, ${fmt(data.resistance)}f)`} description={fieldDoc("hardness").description}>
          {(id) => <NumberInput id={id} value={data.hardness} min={0} max={100} onCommit={(hardness) => set({ hardness })} />}
        </InspectorField>
        <p className="-mt-1 text-xs text-fg-muted">Close to {near.name.toLowerCase()} ({near.hardness})</p>
        <InspectorField label="Blast resistance" description={fieldDoc("resistance").description}>
          {(id) => <NumberInput id={id} value={data.resistance} min={0} max={3_600_000} onCommit={(resistance) => set({ resistance })} />}
        </InspectorField>
        <InspectorField label="Tool" java={data.tool === "none" ? undefined : `BlockTags.MINEABLE_WITH_${data.tool.toUpperCase()}`} description={fieldDoc("tool").description}>
          {(id) => (
            <Choose
              id={id}
              value={data.tool}
              items={TOOLS.map((t) => ({ value: t.id, label: t.label }))}
              onChange={(v) => set({ tool: v as BlockData["tool"], requiresTool: v === "none" ? false : data.requiresTool })}
            />
          )}
        </InspectorField>
        {data.tool !== "none" && (
          <>
            <InspectorField label="Tool tier" java={data.toolTier === "wood" ? undefined : `BlockTags.NEEDS_${data.toolTier.toUpperCase()}_TOOL`} description={fieldDoc("toolTier").description}>
              {(id) => <Choose id={id} value={data.toolTier} items={TOOL_TIERS.map((t) => ({ value: t.id, label: t.label }))} onChange={(v) => set({ toolTier: v as BlockData["toolTier"] })} />}
            </InspectorField>
            <InspectorField label="Drops only with it" java={data.requiresTool ? ".requiresCorrectToolForDrops()" : undefined} description={fieldDoc("requiresTool").description}>
              {(id) => <Switch id={id} size="sm" checked={data.requiresTool} onCheckedChange={(requiresTool) => set({ requiresTool })} />}
            </InspectorField>
          </>
        )}
      </InspectorSection>

      <InspectorSection title="World">
        <InspectorField label="Light level" java={data.light ? `.lightLevel(state -> ${data.light})` : undefined} description={fieldDoc("light").description}>
          {(id) => (
            <div className="flex w-full items-center gap-2.5">
              {/* Commit on release, so dragging the slider is one undo step. */}
              <Slider id={id} key={data.light} defaultValue={[data.light]} min={0} max={15} step={1} onValueCommitted={(v) => set({ light: Array.isArray(v) ? v[0]! : v })} />
              <span className="w-5 text-right text-sm text-fg tabular-nums">{data.light}</span>
            </div>
          )}
        </InspectorField>
        <InspectorField label="Sound" java={`.sound(SoundType.${data.sound.toUpperCase()})`} description={fieldDoc("sound").description}>
          {(id) => <Choose id={id} value={data.sound} items={SOUNDS.map((s) => ({ value: s.id, label: s.label }))} onChange={(v) => set({ sound: v as BlockData["sound"] })} />}
        </InspectorField>
      </InspectorSection>

      <InspectorSection title="Creative tab">
        <InspectorField label="Shows in" description={fieldDoc("tab").description}>
          {(id) => (
            <Choose
              id={id}
              value={data.tab && tabs.some((t) => t.id === data.tab) ? data.tab : NO_TAB}
              items={[{ value: NO_TAB, label: "No tab" }, ...tabs.map((t) => ({ value: t.id, label: t.name }))]}
              onChange={(v) => set({ tab: v === NO_TAB ? null : v })}
            />
          )}
        </InspectorField>
        {data.tab && tabs.some((t) => t.id === data.tab) && (
          <Button variant="ghost" size="sm" className="self-start px-1.5 text-fg-muted" onClick={() => select(data.tab!)}>
            Open the tab →
          </Button>
        )}
        {tabs.length === 0 && <p className="text-xs text-fg-muted">Add a Creative tab from the project tree to show this block in the creative inventory.</p>}
      </InspectorSection>
    </div>
  )
}
