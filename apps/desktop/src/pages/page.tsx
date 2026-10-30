// The shared frame for pages: a calm title, an optional line under it, and content.
import type { ReactNode } from "react"

export function Page({ title, subtitle, actions, children }: { title: string; subtitle?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="w-full max-w-[680px] pt-8 pb-16">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium tracking-[-0.01em] text-fg">{title}</h1>
          {subtitle && <p className="mt-1.5 text-base text-fg-muted">{subtitle}</p>}
        </div>
        {actions}
      </div>
      <div className="mt-8">{children}</div>
    </div>
  )
}

