// shadcn/ui skeleton (added with the shadcn CLI). Sizes tuned to the Figma; colours come from styles.css.
import { cn } from "@blocksy/ui/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-2xl bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
