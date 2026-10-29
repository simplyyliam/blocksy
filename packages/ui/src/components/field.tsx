// Text input and the label/hint wrapper around any control (add-project.png).
import type { ComponentProps, ReactNode } from "react"
import { useId } from "react"
import { cn } from "../cn.ts"

/** The pill-shaped text input: 40px tall, grey fill, no border. */
export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      spellCheck={false}
      className={cn(
        "h-10 w-full rounded-full bg-field px-4 font-sans text-base text-fg outline-none",
        "placeholder:text-fg-faint transition-shadow duration-150 ease-out",
        "focus-visible:shadow-[0_0_0_3px_var(--b-focus)] focus-visible:outline-none",
        "aria-invalid:shadow-[0_0_0_1.5px_var(--b-danger)] disabled:text-fg-faint",
        className,
      )}
      {...props}
    />
  )
}

interface FieldProps {
  label: string
  /** Small grey line under the control ("Creates ~/Blocksy/my_mod"). */
  hint?: ReactNode
  /** Shown instead of the hint, in red, when the value is invalid. */
  error?: string
  className?: string
  /** Render prop gets the id to put on the control, so the label is linked to it. */
  children: (id: string) => ReactNode
}

export function Field({ label, hint, error, className, children }: FieldProps) {
  const id = useId()
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-base text-fg-muted">
        {label}
      </label>
      {children(id)}
      {(error || hint) && (
        <p className={cn("text-base", error ? "text-danger" : "text-fg-muted")}>{error ?? hint}</p>
      )}
    </div>
  )
}
