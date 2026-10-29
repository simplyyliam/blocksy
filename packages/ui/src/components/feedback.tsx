// Small status pieces: a status pill, a spinner, a progress bar and a tooltip.
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip"
import type { ComponentProps, ReactElement, ReactNode } from "react"
import { cn } from "../cn.ts"

/** A non-clickable grey chip with an icon, like "JDK found" in the status bar. */
export function Pill({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md bg-surface px-2.5 text-base whitespace-nowrap text-fg",
        "[&_svg]:size-3.5 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    />
  )
}

/** A thin rotating ring. Inherits the text colour. */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-3.5 animate-spin rounded-full border-[1.5px] border-current border-r-transparent", className)}
    />
  )
}

/** Progress bar. Without a value it shows a calm moving stripe (unknown duration). */
export function Progress({ value, className }: { value?: number; className?: string }) {
  return (
    <div className={cn("relative h-1 w-full overflow-hidden rounded-full bg-surface", className)} role="progressbar">
      {value === undefined ? (
        <div className="absolute inset-y-0 w-1/3 animate-[blocksy-indeterminate_1.4s_var(--b-ease-in-out)_infinite] rounded-full bg-accent" />
      ) : (
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      )}
    </div>
  )
}

/** Shows a short label on hover or focus. Wrap any single element. */
export function Tooltip({ label, children }: { label: ReactNode; children: ReactElement }) {
  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner sideOffset={6} className="z-50">
          <BaseTooltip.Popup
            className={cn(
              "rounded-md bg-fg px-2 py-1 text-sm text-bg shadow-md",
              "origin-(--transform-origin) transition-[opacity,transform] duration-150 ease-out",
              "data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
            )}
          >
            {label}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  )
}

export const TooltipProvider = BaseTooltip.Provider
