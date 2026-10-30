// The shared frame for pages: a calm title, an optional line under it, and content.
// Nothing here may push the page wider than the window: long titles wrap, and the
// action drops under the title when there is no room beside it.
import type { ReactNode } from "react"

export function Page({ title, subtitle, actions, children }: { title: string; subtitle?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[760px] px-4 pt-10 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1 basis-[320px]">
          <h1 className="text-xl font-medium tracking-[-0.01em] break-words text-fg">{title}</h1>
          {subtitle && <p className="mt-1.5 text-base text-fg-muted">{subtitle}</p>}
        </div>
        {actions}
      </div>
      <div className="mt-8">{children}</div>
    </div>
  )
}

