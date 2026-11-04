// The Recipe's canvas: a visual crafting grid (Blocksy's own drawing, not Minecraft's GUI art).
//
//   ( Shaped  Shapeless  Smelting  Blasting  Smoking  Stonecutting )
//
//      ┌───┬───┬───┐                    ┌───┐
//      │   │ W │   │       ──▶          │ B │ ×1
//      ├───┼───┼───┤                    └───┘
//      │ W │ S │ W │
//      └───┴───┴───┘
//
// Click a slot to pick an item or tag; drag a filled slot onto another to move it; the
// little × (or Delete) empties it. Every change is one undo step.
import { ArrowRight, Flame, Slice, X } from "lucide-react"
import { useState, type ReactNode } from "react"
import type { ElementEditorProps, Project } from "@blocksy/core"
import { ItemPicker, RefTile, refLabel, resolveRef } from "@blocksy/game-data"
import { cn, DotPattern, NumberInput, Tabs, TabsList, TabsTrigger } from "@blocksy/ui"
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

interface SlotProps {
  project: Project
  value: string | null
  label: string
  onPick(ref: string): void
  onClear(): void
  allowTags?: boolean
  big?: boolean
  /** Drag and drop between grid slots. */
  index?: number
  onMove?(from: number, to: number): void
  children?: ReactNode
}

/** One slot: empty, or showing the item (texture for this mod's things, a tile for vanilla). */
function Slot({ project, value, label, onPick, onClear, allowTags = true, big, index, onMove, children }: SlotProps) {
  const [over, setOver] = useState(false)
  const missing = value !== null && resolveRef(value, project) === null
  const name = value ? refLabel(value, project) : null
  return (
    <div
      className="group relative"
      onDragOver={(e) => {
        if (onMove && e.dataTransfer.types.includes("application/x-blocksy-slot")) {
          e.preventDefault()
          setOver(true)
        }
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        setOver(false)
        const from = Number(e.dataTransfer.getData("application/x-blocksy-slot"))
        if (onMove && index !== undefined && Number.isInteger(from) && from !== index) onMove(from, index)
      }}
    >
      <ItemPicker
        project={project}
        allowTags={allowTags}
        onPick={onPick}
        trigger={
          <button
            type="button"
            aria-label={name ? `${label}: ${name}` : `${label}: empty`}
            title={name ?? "Click to pick an item"}
            draggable={!!value && index !== undefined}
            onDragStart={(e) => {
              if (index === undefined) return
              e.dataTransfer.setData("application/x-blocksy-slot", String(index))
              e.dataTransfer.effectAllowed = "move"
            }}
            onKeyDown={(e) => {
              if ((e.key === "Delete" || e.key === "Backspace") && value) {
                e.preventDefault()
                onClear()
              }
            }}
            className={cn(
              "grid place-items-center rounded-md bg-surface-pressed shadow-[inset_0_1px_2px_rgb(0_0_0/0.08)] transition-[transform,background-color] duration-150 ease-out hover:bg-surface-hover active:scale-95",
              big ? "size-16" : "size-12",
              over && "ring-2 ring-brand",
              missing && "ring-2 ring-danger/60",
            )}
          >
            {value && <RefTile refValue={value} project={project} className={big ? "size-10" : "size-8"} />}
          </button>
        }
      />
      {value && (
        <button
          type="button"
          aria-label={`Empty ${label.toLowerCase()}`}
          onClick={onClear}
          className="absolute -top-1.5 -right-1.5 hidden size-4 place-items-center rounded-full bg-fg text-bg shadow-sm group-hover:grid focus-visible:grid"
        >
          <X className="size-2.5" strokeWidth={3} />
        </button>
      )}
      {children}
    </div>
  )
}

export function RecipeCanvas({ element, project, change }: ElementEditorProps<RecipeData>) {
  const data = element.data
  const set = (patch: Partial<RecipeData>) => change({ ...data, ...patch })
  const setSlot = (i: number, ref: string | null) => set({ grid: data.grid.map((s, j) => (j === i ? ref : s)) })
  const move = (from: number, to: number) => {
    const grid = [...data.grid]
    ;[grid[from], grid[to]] = [grid[to]!, grid[from]!]
    set({ grid })
  }
  const problems = recipeProblems(data, (ref) => resolveRef(ref, project) !== null)
  const Station = isCooking(data.kind) ? Flame : data.kind === "stonecutting" ? Slice : ArrowRight

  return (
    <div className="relative grid size-full place-items-center">
      <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_85%)]">
        <DotPattern width={18} height={18} cr={0.9} className="text-fg-faint opacity-60" />
      </div>

      <div className="relative flex flex-col items-center gap-6 px-4 pb-20">
        <Tabs value={data.kind} onValueChange={(v) => v && change(changeKind(data, v as RecipeKind))}>
          <TabsList className="h-8 max-w-full overflow-x-auto bg-bg/90 shadow-sm backdrop-blur-md">
            {RECIPE_KINDS.map((kind) => (
              <TabsTrigger key={kind} value={kind} className="h-6 px-2.5 text-sm">
                {KIND_LABELS[kind]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* The station card: inputs, an arrow (or flame/saw), the result. */}
        <div className="flex items-center gap-6 rounded-2xl bg-bg/95 p-6 shadow-md backdrop-blur-md">
          {isCrafting(data.kind) ? (
            <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Crafting grid">
              {data.grid.map((slot, i) => (
                <Slot
                  key={i}
                  index={i}
                  project={project}
                  value={slot}
                  label={`Slot ${i + 1}`}
                  onPick={(ref) => setSlot(i, ref)}
                  onClear={() => setSlot(i, null)}
                  onMove={move}
                />
              ))}
            </div>
          ) : (
            <Slot project={project} value={data.ingredient} label="Ingredient" big onPick={(ingredient) => set({ ingredient })} onClear={() => set({ ingredient: null })} />
          )}

          <div className="flex flex-col items-center gap-1 text-fg-muted">
            <Station className={cn("size-6", isCooking(data.kind) && "text-warning motion-safe:animate-pulse")} strokeWidth={1.75} />
            {isCooking(data.kind) && <span className="text-xs tabular-nums">{data.cookingTime / 20}s</span>}
          </div>

          <div className="flex flex-col items-center gap-2">
            <Slot project={project} value={data.result} label="Result" big allowTags={false} onPick={(result) => set({ result })} onClear={() => set({ result: null })} />
            <label className="flex items-center gap-1 text-xs text-fg-muted">
              ×
              <NumberInput value={data.count} min={1} max={99} step={1} onCommit={(count) => set({ count: Math.round(count) })} className="h-7 w-12" />
            </label>
          </div>
        </div>

        <div className="flex min-h-10 flex-col items-center gap-1 text-center">
          {problems.length > 0 ? (
            problems.map((p) => (
              <p key={p} className="text-sm text-fg-muted">
                {p}. Until then this recipe isn't built.
              </p>
            ))
          ) : (
            <p className="text-sm text-fg-muted">
              {STATION[data.kind]}: {data.kind === "shapeless" ? "any arrangement works" : data.kind === "shaped" ? "the pattern counts, empty edges are trimmed" : "one in, one out"}.
            </p>
          )}
          <p className="text-xs text-fg-faint">Click a slot to pick an item or tag. Drag to move, × to empty.</p>
        </div>
      </div>
    </div>
  )
}
