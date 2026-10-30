// shadcn/ui spinner (added with the shadcn CLI). Sizes tuned to the Figma; colours come from styles.css.
import { cn } from "@blocksy/ui/lib/utils"
import { Loader2Icon } from "lucide-react"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon data-slot="spinner" role="status" aria-label="Loading" className={cn("size-3.5 animate-spin", className)} {...props} />
  )
}

export { Spinner }
