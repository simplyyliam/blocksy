// The credits: a short line in every page footer, and the full list on the Credits page.
import { ExternalLink } from "lucide-react"
import { CREDITS, DISCLAIMER, FEATURED } from "../credits.ts"
import { useDocsHost } from "../context.ts"

export function CreditsFooter() {
  const { navigate, openExternal } = useDocsHost()
  return (
    <footer data-grass-edge className="not-prose mt-16 pt-6 text-xs text-fd-muted-foreground shadow-[0_-1px_0_var(--color-fd-border)]">
      <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        <span>Made with thanks to</span>
        {FEATURED.map((c, i) => (
          <span key={c.name}>
            <button type="button" className="text-fd-foreground underline-offset-2 hover:underline" onClick={() => openExternal(c.url)}>
              {c.name}
            </button>
            {i < FEATURED.length - 1 ? "," : ""}
          </span>
        ))}
        <span>and</span>
        <button type="button" className="text-fd-foreground underline-offset-2 hover:underline" onClick={() => navigate("/docs/credits")}>
          everyone on the Credits page
        </button>
      </p>
    </footer>
  )
}

export function CreditsList() {
  const { openExternal } = useDocsHost()
  return (
    <div className="not-prose flex flex-col gap-8">
      {CREDITS.map((group) => (
        <section key={group.title}>
          <h2 className="mb-3 text-sm font-medium text-fd-foreground">{group.title}</h2>
          <ul className="flex flex-col divide-y divide-fd-border overflow-hidden rounded-xl bg-fd-card shadow-[inset_0_0_0_1px_var(--color-fd-border)]">
            {group.credits.map((c) => (
              <li key={c.name} className="flex items-start justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm text-fd-foreground">
                    {c.name} <span className="text-fd-muted-foreground">· {c.work}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-fd-muted-foreground">
                    {c.usedFor}
                    {c.license ? ` License: ${c.license}.` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openExternal(c.url)}
                  aria-label={`Open ${c.name}`}
                  className="shrink-0 rounded-md p-1.5 text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground"
                >
                  <ExternalLink className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="text-xs text-fd-muted-foreground">{DISCLAIMER}</p>
    </div>
  )
}
