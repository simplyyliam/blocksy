// Dialog: a centred card over a soft dimmed backdrop (add-project.png).
// Enters with a short fade + rise, leaves the same way; Esc and clicking outside close it.
import { Dialog as BaseDialog } from "@base-ui/react/dialog"
import type { ReactNode } from "react"
import { cn } from "../cn.ts"

interface DialogProps {
  open: boolean
  onOpenChange(open: boolean): void
  title: string
  children: ReactNode
  className?: string
}

export function Dialog({ open, onOpenChange, title, children, className }: DialogProps) {
  return (
    <BaseDialog.Root open={open} onOpenChange={onOpenChange}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop
          className={cn(
            "fixed inset-0 z-40 bg-overlay transition-opacity duration-200 ease-out",
            "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
          )}
        />
        <BaseDialog.Popup
          className={cn(
            "fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-bg shadow-lg outline-none",
            "max-h-[calc(100vh-48px)] max-w-[calc(100vw-48px)] overflow-hidden",
            "transition-[opacity,transform,scale] duration-250 ease-out",
            "data-[starting-style]:translate-y-[calc(-50%+8px)] data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0",
            "data-[ending-style]:translate-y-[calc(-50%+4px)] data-[ending-style]:scale-[0.99] data-[ending-style]:opacity-0 data-[ending-style]:duration-150",
            className,
          )}
        >
          <BaseDialog.Title className="sr-only">{title}</BaseDialog.Title>
          {children}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  )
}

/** Closes the dialog it sits in. */
export const DialogClose = BaseDialog.Close
