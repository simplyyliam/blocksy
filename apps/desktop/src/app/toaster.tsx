// Shows toasts from the toast store in the bottom-right, above the status bar.
import { X } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { cn } from "@blocksy/ui"
import { useToasts } from "../shared/stores/toasts"

export function Toaster() {
  const { toasts, dismiss } = useToasts()
  return (
    <div className="pointer-events-none fixed right-5 bottom-14 z-50 flex w-[340px] flex-col items-end gap-2" aria-live="polite">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.15 } }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto flex min-h-10 w-full items-center gap-3 rounded-lg bg-popover py-2 pr-2 pl-4 shadow-md"
            role={toast.tone === "error" ? "alert" : "status"}
          >
            <p className={cn("flex-1 text-base", toast.tone === "error" ? "text-danger" : "text-fg")}>{toast.message}</p>
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  toast.action!.run()
                  dismiss(toast.id)
                }}
                className="h-7 shrink-0 rounded-md bg-surface px-2.5 text-base text-fg outline-none hover:bg-surface-hover"
              >
                {toast.action.label}
              </button>
            )}
            <button type="button" aria-label="Dismiss" onClick={() => dismiss(toast.id)} className="grid size-7 shrink-0 place-items-center rounded-md text-fg-muted hover:bg-surface">
              <X className="size-3.5" strokeWidth={1.75} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
