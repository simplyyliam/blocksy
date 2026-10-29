// Collapsible: a "> Advanced" row that smoothly reveals extra fields.
import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible"
import { ChevronRight } from "lucide-react"
import type { ReactNode } from "react"

export function Collapsible({ label, children }: { label: string; children: ReactNode }) {
  return (
    <BaseCollapsible.Root>
      <BaseCollapsible.Trigger className="group flex h-7 items-center gap-2 rounded-md text-base text-fg outline-none focus-visible:shadow-[0_0_0_3px_var(--b-focus)]">
        <ChevronRight
          className="size-3.5 transition-transform duration-200 ease-out group-data-[panel-open]:rotate-90"
          strokeWidth={2}
        />
        {label}
      </BaseCollapsible.Trigger>
      <BaseCollapsible.Panel className="h-(--collapsible-panel-height) overflow-hidden transition-[height,opacity] duration-200 ease-out data-[starting-style]:h-0 data-[starting-style]:opacity-0 data-[ending-style]:h-0 data-[ending-style]:opacity-0">
        <div className="pt-3">{children}</div>
      </BaseCollapsible.Panel>
    </BaseCollapsible.Root>
  )
}
