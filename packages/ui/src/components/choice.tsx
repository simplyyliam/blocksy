// Choice: a row of pill options where exactly one is picked (Loader: Fabric / NeoForge).
import { Toggle } from "@base-ui/react/toggle"
import { ToggleGroup } from "@base-ui/react/toggle-group"
import { cn } from "../cn.ts"

export interface ChoiceOption {
  value: string
  label: string
  disabled?: boolean
  /** Why it's disabled, shown as a native tooltip ("Arrives after 1.0"). */
  note?: string
}

interface ChoiceProps {
  value: string
  options: ChoiceOption[]
  onChange(value: string): void
  "aria-label"?: string
}

export function Choice({ value, options, onChange, ...rest }: ChoiceProps) {
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(next) => next[0] && onChange(next[0] as string)}
      className="flex gap-2"
      aria-label={rest["aria-label"]}
    >
      {options.map((option) => (
        <Toggle
          key={option.value}
          value={option.value}
          disabled={option.disabled}
          title={option.note}
          className={cn(
            "h-10 w-[158px] rounded-full bg-field px-4 text-left text-base text-fg outline-none",
            "transition-[background-color,box-shadow,color] duration-150 ease-out hover:bg-surface-hover",
            "focus-visible:shadow-[0_0_0_3px_var(--b-focus)]",
            "data-[pressed]:shadow-[inset_0_0_0_1.5px_var(--b-fg)]",
            "data-[disabled]:pointer-events-auto data-[disabled]:text-fg-faint data-[disabled]:hover:bg-field",
          )}
        >
          {option.label}
        </Toggle>
      ))}
    </ToggleGroup>
  )
}
