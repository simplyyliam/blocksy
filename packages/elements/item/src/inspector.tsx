// The Item's editor panel: the floating inspector on the right of the project editor.
// Every edit goes through `change` (a command), so it can be undone. Each field shows the
// Java it becomes, in small grey mono, so you learn the code while you click.
import { Plus, X } from "lucide-react"
import type { ElementEditorProps } from "@blocksy/core"
import {
  Button, Input, InspectorField, InspectorSection, NumberInput, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Slider, Switch, Textarea,
} from "@blocksy/ui"
import { fieldDoc } from "./docs.ts"
import { EFFECTS, FUEL_EXAMPLES, RARITIES, TICKS_PER_SMELT } from "./options.ts"
import { foodDefaults, type EffectData, type FoodData, type ItemData } from "./schema.ts"

/** The id of the Creative tab element type (its own package). Data references, not imports. */
const CREATIVE_TAB_TYPE = "creative_tab"
/** "No tab" in the select. "@" can't start an element id, so no tab can collide with it. */
const NO_TAB = "@none"

interface Choice {
  value: string
  label: string
}

/** A compact select over a fixed list of choices. */
function Choose({ id, value, items, onChange, className }: { id?: string; value: string; items: Choice[]; onChange(v: string): void; className?: string }) {
  return (
    <Select items={items} value={value} onValueChange={(v) => v !== null && onChange(v)}>
      <SelectTrigger id={id} size="sm" className={className ?? "w-full"}>
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

/** Java float literal: 0.6 -> "0.6f", 1 -> "1.0f". */
const float = (n: number) => `${Number.isInteger(n) ? n.toFixed(1) : n}f`
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`

/** One food effect row: effect, seconds, level, chance. */
function EffectRow({ effect, onChange, onRemove }: { effect: EffectData; onChange(e: EffectData): void; onRemove(): void }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg bg-surface p-2">
      <div className="flex items-center gap-1.5">
        <Choose value={effect.effect} items={EFFECTS.map((e) => ({ value: e.id, label: e.label }))} onChange={(v) => onChange({ ...effect, effect: v as EffectData["effect"] })} />
        <Button variant="ghost" size="icon-sm" aria-label="Remove effect" title="Remove effect" onClick={onRemove}>
          <X strokeWidth={1.75} />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-1.5 text-xs text-fg-muted">
        <label className="flex flex-col gap-1">
          Seconds
          <NumberInput value={effect.seconds} min={0.05} max={3600} onCommit={(seconds) => onChange({ ...effect, seconds })} className="h-7" />
        </label>
        <label className="flex flex-col gap-1">
          Level
          <NumberInput value={effect.amplifier + 1} min={1} max={10} step={1} onCommit={(level) => onChange({ ...effect, amplifier: Math.round(level) - 1 })} className="h-7" />
        </label>
        <label className="flex flex-col gap-1">
          Chance %
          <NumberInput value={Math.round(effect.chance * 100)} min={0} max={100} step={1} onCommit={(pct) => onChange({ ...effect, chance: pct / 100 })} className="h-7" />
        </label>
      </div>
    </div>
  )
}

export function ItemInspector({ element, project, change, rename, select }: ElementEditorProps<ItemData>) {
  const data = element.data
  const set = (patch: Partial<ItemData>) => change({ ...data, ...patch })
  const setFood = (patch: Partial<FoodData>) => set({ food: { ...(data.food ?? foodDefaults()), ...patch } })
  const tabs = project.elements.filter((e) => e.type === CREATIVE_TAB_TYPE)
  const food = data.food
  const smelts = data.fuelTicks / TICKS_PER_SMELT
  const nearFuel = FUEL_EXAMPLES.reduce((a, b) => (Math.abs(b.ticks - data.fuelTicks) < Math.abs(a.ticks - data.fuelTicks) ? b : a))

  return (
    <div className="flex flex-col divide-y divide-line-subtle py-1">
      <InspectorSection title="Item">
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
        <InspectorField label="ID" description="Made from the first name. It never changes: worlds save items by id.">
          {() => (
            <code className="truncate font-mono text-xs text-fg-muted" data-selectable title={`${project.modId}:${element.id}`}>
              {project.modId}:{element.id}
            </code>
          )}
        </InspectorField>
        <p className="text-xs text-fg-muted">
          {data.texture
            ? data.animation
              ? "Animated texture. Paint each frame on the canvas."
              : "Paint the texture on the canvas. Add frames there to animate it."
            : "No texture yet: paint one on the canvas, or import a 16x16 PNG there."}
        </p>
      </InspectorSection>

      <InspectorSection title="Stack">
        <InspectorField label="Stack size" java={data.maxStackSize !== 64 ? `.stacksTo(${data.maxStackSize})` : undefined} description={fieldDoc("maxStackSize").description}>
          {(id) => <NumberInput id={id} value={data.maxStackSize} min={1} max={99} step={1} onCommit={(n) => set({ maxStackSize: Math.round(n) })} />}
        </InspectorField>
        <InspectorField label="Rarity" java={data.rarity !== "common" ? `.rarity(Rarity.${data.rarity.toUpperCase()})` : undefined} description={fieldDoc("rarity").description}>
          {(id) => <Choose id={id} value={data.rarity} items={RARITIES.map((r) => ({ value: r.id, label: r.label }))} onChange={(v) => set({ rarity: v as ItemData["rarity"] })} />}
        </InspectorField>
        <InspectorField label="Fire resistant" java={data.fireResistant ? ".fireResistant()" : undefined} description={fieldDoc("fireResistant").description}>
          {(id) => <Switch id={id} size="sm" checked={data.fireResistant} onCheckedChange={(fireResistant) => set({ fireResistant })} />}
        </InspectorField>
      </InspectorSection>

      <InspectorSection title="Food">
        <InspectorField label="Can be eaten" description={fieldDoc("food").description}>
          {(id) => <Switch id={id} size="sm" checked={!!food} onCheckedChange={(on) => set({ food: on ? foodDefaults() : null })} />}
        </InspectorField>
        {food && (
          <>
            <InspectorField label="Nutrition" java={`.nutrition(${food.nutrition})`} description="Hunger points it fills. Each drumstick on the hunger bar is 2; bread is 5, steak 8.">
              {(id) => <NumberInput id={id} value={food.nutrition} min={0} max={20} step={1} onCommit={(n) => setFood({ nutrition: Math.round(n) })} />}
            </InspectorField>
            <InspectorField label="Saturation" java={`.saturationModifier(${float(food.saturation)})`} description="How long you stay full: saturation = nutrition × this × 2. Bread is 0.6, steak 0.8.">
              {(id) => <NumberInput id={id} value={food.saturation} min={0} max={5} onCommit={(saturation) => setFood({ saturation })} />}
            </InspectorField>
            <p className="-mt-1 text-xs text-fg-muted">
              Fills {food.nutrition / 2} drumstick{food.nutrition === 2 ? "" : "s"}, adds {Math.round(food.nutrition * food.saturation * 2 * 10) / 10} saturation.
            </p>
            <InspectorField label="Always edible" java={food.alwaysEdible ? ".alwaysEdible()" : undefined} description="Can be eaten even with a full hunger bar, like golden apples.">
              {(id) => <Switch id={id} size="sm" checked={food.alwaysEdible} onCheckedChange={(alwaysEdible) => setFood({ alwaysEdible })} />}
            </InspectorField>
            <div className="flex items-center justify-between">
              <span className="text-sm text-fg" title={fieldDoc("effects").description}>
                Effects
              </span>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Add effect"
                title="Add effect"
                disabled={food.effects.length >= 8}
                onClick={() => setFood({ effects: [...food.effects, { effect: "speed", seconds: 10, amplifier: 0, chance: 1 }] })}
              >
                <Plus strokeWidth={2} />
              </Button>
            </div>
            {food.effects.length === 0 && <p className="-mt-1 text-xs text-fg-faint">None. Eating gives no status effects.</p>}
            {food.effects.map((effect, i) => (
              <EffectRow
                key={i}
                effect={effect}
                onChange={(e) => setFood({ effects: food.effects.map((x, j) => (j === i ? e : x)) })}
                onRemove={() => setFood({ effects: food.effects.filter((_, j) => j !== i) })}
              />
            ))}
            {food.effects.length > 0 && (
              <code className="truncate font-mono text-xs text-fg-faint" title={fieldDoc("effects").java}>
                MobEffects.{food.effects[0]!.effect.toUpperCase()}, {Math.round(food.effects[0]!.seconds * 20)} ticks
              </code>
            )}
          </>
        )}
      </InspectorSection>

      <InspectorSection title="Furnace and composter">
        <InspectorField label="Burns as fuel" description={fieldDoc("fuelTicks").description}>
          {(id) => <Switch id={id} size="sm" checked={data.fuelTicks > 0} onCheckedChange={(on) => set({ fuelTicks: on ? 300 : 0 })} />}
        </InspectorField>
        {data.fuelTicks > 0 && (
          <>
            <InspectorField label="Burn time (ticks)" java={`burn time ${data.fuelTicks} ticks`}>
              {(id) => <NumberInput id={id} value={data.fuelTicks} min={1} max={32000} step={1} onCommit={(n) => set({ fuelTicks: Math.round(n) })} />}
            </InspectorField>
            <p className="-mt-1 text-xs text-fg-muted">
              Smelts {Number.isInteger(smelts) ? plural(smelts, "item") : `${smelts.toFixed(1)} items`} · close to {nearFuel.name.toLowerCase()} ({nearFuel.ticks})
            </p>
          </>
        )}
        <InspectorField label="Compost chance" java={data.compostChance > 0 ? `compost chance ${float(Math.round(data.compostChance * 100) / 100)}` : undefined} description={fieldDoc("compostChance").description}>
          {(id) => (
            <div className="flex w-full items-center gap-2.5">
              {/* Commit on release, so dragging the slider is one undo step. */}
              <Slider
                id={id}
                key={data.compostChance}
                defaultValue={[Math.round(data.compostChance * 100)]}
                min={0}
                max={100}
                step={5}
                onValueCommitted={(v) => set({ compostChance: (Array.isArray(v) ? v[0]! : v) / 100 })}
              />
              <span className="w-9 text-right text-sm text-fg tabular-nums">{Math.round(data.compostChance * 100)}%</span>
            </div>
          )}
        </InspectorField>
      </InspectorSection>

      <InspectorSection title="Tooltip">
        <Textarea
          key={data.tooltip.join("\n")}
          aria-label="Tooltip lines"
          defaultValue={data.tooltip.join("\n")}
          placeholder={"Extra lines under the name.\nOne per line."}
          rows={3}
          spellCheck
          className="min-h-16 text-sm"
          onBlur={(e) => {
            const lines = e.target.value.split("\n").map((l) => l.trim().slice(0, 120)).filter(Boolean).slice(0, 6)
            if (lines.join("\n") !== data.tooltip.join("\n")) set({ tooltip: lines })
          }}
        />
        {data.tooltip.length > 0 && <code className="truncate font-mono text-xs text-fg-faint">{`"item.${project.modId}.${element.id}.tooltip.0"`}</code>}
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
        {tabs.length === 0 && <p className="text-xs text-fg-muted">Add a Creative tab from the project tree to show this item in the creative inventory.</p>}
      </InspectorSection>
    </div>
  )
}
