// Inspector building blocks for element editors (Block, Creative tab, ...).
// Custom because shadcn has no "property inspector" layout; these only arrange
// shadcn pieces (Field, Input) into compact rows, like Figma's right panel.
//
//   MINING                       <- InspectorSection
//   Hardness            [ 1.5 ]  <- InspectorField (label left, control right)
//   .strength(1.5f, 6f)          <- the Java hint under it (teaches as you edit)
import { useEffect, useId, useState, type ReactNode } from "react"
import { Input } from "./ui/input.tsx"
import { cn } from "../lib/utils.ts"

export function InspectorSection({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col gap-2.5 py-3 first:pt-0 last:pb-0", className)}>
      <h3 className="text-xs font-medium tracking-[0.04em] text-fg-muted uppercase">{title}</h3>
      {children}
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
    <div className="flex flex-col gap-1">
      <div className={cn("flex gap-3", stacked ? "flex-col gap-1.5" : "min-h-8 items-center justify-between")}>
        <label htmlFor={id} title={description} className="shrink-0 text-sm text-fg">
          {label}
        </label>
        <div className={cn("flex min-w-0 items-center justify-end", !stacked && "w-[148px]")}>{children(id)}</div>
      </div>
      {java && <code className="truncate font-mono text-xs text-fg-faint" title={java}>{java}</code>}
    </div>
  )
}

interface NumberInputProps {
  id?: string
  value: number
  min?: number
  max?: number
  step?: number
  /** Called once when editing ends (blur or Enter), so one edit = one undo step. */
  onCommit(value: number): void
  className?: string
}

/** A number box that commits on blur/Enter and snaps back if the text isn't a valid number. */
export function NumberInput({ id, value, min, max, step = 0.1, onCommit, className }: NumberInputProps) {
  const [text, setText] = useState(String(value))
  useEffect(() => setText(String(value)), [value])

  const commit = () => {
    const parsed = Number(text.replace(",", "."))
    if (text.trim() === "" || !Number.isFinite(parsed)) return setText(String(value))
    const clamped = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, parsed))
    setText(String(clamped))
    if (clamped !== value) onCommit(clamped)
  }

  return (
    <Input
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
      className={cn("h-8 text-right tabular-nums", className)}
    />
  )
}
