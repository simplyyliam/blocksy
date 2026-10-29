// NavItem: one row in a side list (Home, Docs, a project, a dialog's left column).
// Active rows get the soft grey pill; others show it on hover.
import type { ComponentProps, ReactNode } from "react"
import { cn } from "../cn.ts"

interface NavItemProps extends ComponentProps<"button"> {
  active?: boolean
  /** Icon or swatch before the label. */
  leading?: ReactNode
}

export function NavItem({ active, leading, className, children, ...props }: NavItemProps) {
  return (
    <button
      type="button"
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-7 w-full items-center gap-2 rounded-md px-2 text-left text-base text-fg outline-none",
        "transition-colors duration-150 ease-out hover:bg-surface focus-visible:shadow-[0_0_0_3px_var(--b-focus)]",
        "disabled:text-fg-faint disabled:hover:bg-transparent",
        active && "bg-surface hover:bg-surface",
        className,
      )}
      {...props}
    >
      {leading}
      <span className="truncate">{children}</span>
    </button>
  )
}

/** Small grey heading above a group of NavItems ("Projects"). */
export function NavLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("px-2 pb-1.5 text-base text-fg-muted", className)}>{children}</div>
}
