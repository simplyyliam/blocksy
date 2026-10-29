// Select: the pill dropdown (Version in add-project.png), built on Base UI for
// keyboard support. The list opens under the trigger with a short fade and scale.
import { Select as BaseSelect } from "@base-ui/react/select"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "../cn.ts"

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps {
  id?: string
  value: string
  options: SelectOption[]
  onChange(value: string): void
  className?: string
}

export function Select({ id, value, options, onChange, className }: SelectProps) {
  return (
    <BaseSelect.Root
      items={options}
      value={value}
      onValueChange={(next) => next !== null && onChange(next as string)}
    >
      <BaseSelect.Trigger
        id={id}
        className={cn(
          "flex h-10 items-center justify-between gap-2 rounded-full bg-field pr-3.5 pl-4 text-base text-fg outline-none",
          "transition-[background-color,box-shadow] duration-150 ease-out hover:bg-surface-hover",
          "focus-visible:shadow-[0_0_0_3px_var(--b-focus)] focus-visible:outline-none",
          className,
        )}
      >
        <BaseSelect.Value />
        <BaseSelect.Icon className="text-fg transition-transform duration-200 ease-out data-[popup-open]:rotate-180">
          <ChevronDown className="size-4" strokeWidth={1.75} />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner sideOffset={6} alignItemWithTrigger={false} className="z-50 outline-none">
          <BaseSelect.Popup
            className={cn(
              "min-w-(--anchor-width) origin-(--transform-origin) rounded-lg bg-popover p-1 shadow-md outline-none",
              "transition-[opacity,transform] duration-150 ease-out",
              "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
              "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
            )}
          >
            {options.map((option) => (
              <BaseSelect.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className={cn(
                  "flex h-8 items-center justify-between gap-6 rounded-md px-3 text-base text-fg outline-none",
                  "data-[highlighted]:bg-surface data-[disabled]:text-fg-faint",
                )}
              >
                <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
                <BaseSelect.ItemIndicator>
                  <Check className="size-3.5" strokeWidth={2} />
                </BaseSelect.ItemIndicator>
              </BaseSelect.Item>
            ))}
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  )
}
