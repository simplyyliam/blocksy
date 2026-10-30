// shadcn/ui separator (added with the shadcn CLI). Sizes tuned to the Figma; colours come from styles.css.
"use client"

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"
import { cn } from "@blocksy/ui/lib/utils"

function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
