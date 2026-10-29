// Button: every clickable control in Blocksy. Variants match the Figma designs.
import { Button as BaseButton } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../cn.ts"

export const buttonStyles = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap font-sans select-none",
    "transition-[background-color,color,box-shadow,opacity,transform] duration-150 ease-out",
    "active:scale-[0.98] disabled:pointer-events-none disabled:text-fg-faint",
    "[&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        /** Grey pill: header actions, status chips (App.png). */
        pill: "bg-surface text-fg hover:bg-surface-hover active:bg-surface-pressed",
        /** Blue: the one main action of a screen (Create). */
        primary: "bg-accent text-on-accent hover:bg-accent-hover disabled:bg-accent/50 disabled:text-on-accent",
        /** Quiet with a hairline: secondary dialog actions (Cancel). */
        quiet: "bg-subtle text-fg shadow-[inset_0_0_0_1px_var(--b-line-subtle)] hover:bg-surface",
        /** No background until hovered: nav rows, icon buttons. */
        ghost: "bg-transparent text-fg hover:bg-surface active:bg-surface-hover",
        danger: "bg-surface text-danger hover:bg-surface-hover",
      },
      size: {
        sm: "h-7 rounded-md px-2.5 text-base", // 28px: header and status pills
        md: "h-10 rounded-full px-4.5 text-base", // 40px: dialog buttons
        icon: "size-7 rounded-md",
      },
    },
    defaultVariants: { variant: "pill", size: "sm" },
  },
)

export type ButtonProps = BaseButton.Props & VariantProps<typeof buttonStyles>

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <BaseButton className={cn(buttonStyles({ variant, size }), className)} {...props} />
}
