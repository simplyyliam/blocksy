// Inspector building blocks for element editors (Block, Item, Recipe, ...).
// Custom because shadcn has no "property panel" layout; these only arrange shadcn pieces
// (Input, Checkbox) into a tool panel in the spirit of Blender's Properties editor and
// Blockbench's side panels: tabs on top, collapsible sections with a clear header edge,
// compact label + field rows, number fields you can drag.
//
//   [Properties] [Behaviour] [Code]      <- InspectorTabs
//   ▾ Mining                          +  <- InspectorSection (collapsible, `tab` picks its tab)
//     Hardness            [ 1.5   ]      <- InspectorField (label left, control right)
//     .strength(1.5f, 6f)                <- the Java hint under it (teaches as you edit)
import { ChevronRight } from "lucide-react"
import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react"
import { Input } from "./ui/input.tsx"
import { cn } from "../lib/utils.ts"

/** The active tab id while inside InspectorTabs (null = no tabs, show every section). */
const ActiveTab = createContext<string | null>(null)

export interface InspectorTab {
  id: string
  label: string
}

/**
 * Tabs for a whole inspector. Sections choose their tab with `tab` ("properties" by default);
 * a section whose tab is not the active one renders nothing. `codePanel` fills the "code" tab.
 */
export function InspectorTabs({ tabs, codePanel, children }: { tabs: InspectorTab[]; codePanel?: ReactNode; children: ReactNode }) {
  const all = codePanel ? [...tabs, { id: "code", label: "Code" }] : tabs
  const [active, setActive] = useState(all[0]?.id ?? "properties")
  const current = all.some((t) => t.id === active) ? active : (all[0]?.id ?? "properties")
  return (
    <div className="flex min-h-full flex-col">
      {/* Sticky so the tabs stay in reach while a long panel scrolls. */}
      <div role="tablist" aria-label="Inspector" className="sticky top-0 z-10 flex h-8 shrink-0 items-stretch gap-0.5 border-b border-line-subtle bg-surface px-1.5">
        {all.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={current === t.id}
            onClick={() => setActive(t.id)}
            className={cn(
              "relative px-2 text-xs outline-none focus-visible:bg-surface-hover",
              current === t.id ? "text-fg after:absolute after:inset-x-1.5 after:bottom-0 after:h-0.5 after:rounded-full after:bg-brand" : "text-fg-muted hover:text-fg",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <ActiveTab.Provider value={current}>{current === "code" ? codePanel : children}</ActiveTab.Provider>
    </div>
  )
}

export function InspectorSection({
  title,
  tab = "properties",
  action,
  children,
  className,
  defaultOpen = true,
}: {
  title: string
  tab?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  defaultOpen?: boolean
}) {
  const active = useContext(ActiveTab)
  const [open, setOpen] = useState(defaultOpen)
  if (active !== null && active !== tab) return null
  return (
    <section className="border-b border-line-subtle">
      {/* The header is a band with its own tint, so each section has a clear edge. */}
      <div className="flex h-6.5 items-center justify-between gap-1 bg-surface-hover/50 pr-1.5 pl-1">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="flex h-6.5 min-w-0 flex-1 items-center gap-1 text-left text-xs font-medium text-fg outline-none focus-visible:underline"
        >
          <ChevronRight className={cn("size-3 shrink-0 text-fg-muted transition-transform duration-150", open && "rotate-90")} strokeWidth={2} />
          <span className="truncate">{title}</span>
        </button>
        {action}
      </div>
      {open && <div className={cn("flex flex-col gap-1 px-3 py-2", className)}>{children}</div>}
    </section>
  )
}

interface InspectorFieldProps {
  label: string
  /** Shown under the row in mono: the Java this field turns into. */
  java?: string
  /** Longer explanation, shown as a tooltip on the label. */
  description?: string
  /** Stack the control under the label instead of beside it (for wide controls). */
  stacked?: boolean
  children: (id: string) => ReactNode
}

export function InspectorField({ label, java, description, stacked, children }: InspectorFieldProps) {
  const id = useId()
  return (
    <div className="flex flex-col gap-0.5">
      <div className={cn("flex gap-2", stacked ? "flex-col gap-1" : "min-h-6.5 items-center justify-between")}>
        <label htmlFor={id} title={description} className="shrink-0 text-xs text-fg-muted">
          {label}
        </label>
        <div className={cn("flex min-w-0 items-center justify-end", !stacked && "w-[58%]")}>{children(id)}</div>
      </div>
      {java && (
        <code className="truncate font-mono text-[11px] text-fg-faint" title={java}>
          {java}
        </code>
      )}
    </div>
  )
}

interface NumberInputProps {
  id?: string
  value: number
  min?: number
  max?: number
  step?: number
  /** Shown inside the field on the right, e.g. "s", "ticks", "%". */
  unit?: string
  /** Called once when editing ends (blur, Enter or the end of a drag), so one edit = one undo step. */
  onCommit(value: number): void
  className?: string
}

const decimals = (step: number) => (String(step).split(".")[1] ?? "").length

/**
 * A number box. Click to type (commits on blur/Enter, snaps back if invalid), or drag it
 * sideways to scrub the value like Blender (Shift = fine steps). A drag is one undo step.
 */
export function NumberInput({ id, value, min, max, step = 0.1, unit, onCommit, className }: NumberInputProps) {
  const [text, setText] = useState(String(value))
  useEffect(() => setText(String(value)), [value])
  const input = useRef<HTMLInputElement>(null)
  const drag = useRef<{ x: number; start: number; moved: boolean; latest: number } | null>(null)

  const clamp = (n: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n))

  const commit = () => {
    const parsed = Number(text.replace(",", "."))
    if (text.trim() === "" || !Number.isFinite(parsed)) return setText(String(value))
    const clamped = clamp(parsed)
    setText(String(clamped))
    if (clamped !== value) onCommit(clamped)
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (document.activeElement === input.current) return // already typing: normal text editing
    drag.current = { x: e.clientX, start: value, moved: false, latest: value }
    e.currentTarget.setPointerCapture(e.pointerId)
    e.preventDefault()
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x
    if (!d.moved && Math.abs(dx) < 3) return
    d.moved = true
    const unitStep = e.shiftKey ? step / 10 : step
    const next = clamp(Number((d.start + Math.round(dx / 4) * unitStep).toFixed(decimals(step) + (e.shiftKey ? 1 : 0))))
    d.latest = next
    setText(String(next))
  }
  const onPointerUp = () => {
    const d = drag.current
    drag.current = null
    if (!d) return
    if (!d.moved) {
      input.current?.focus()
      input.current?.select()
    } else if (d.latest !== value) onCommit(d.latest)
  }

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className="relative w-full [&:not(:focus-within)]:cursor-ew-resize"
    >
      <Input
        ref={input}
        id={id}
        inputMode="decimal"
        value={text}
        step={step}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit()
          if (e.key === "Escape") setText(String(value))
        }}
        style={unit ? { paddingRight: `${unit.length * 6 + 16}px` } : undefined}
        className={cn("h-6.5 text-right tabular-nums [&:not(:focus)]:cursor-ew-resize", className)}
      />
      {unit && <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[11px] text-fg-faint">{unit}</span>}
    </div>
  )
}
