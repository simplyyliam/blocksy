// Community: curated links from community.json, each crediting its creator (plan 11.3).
import { ExternalLink } from "lucide-react"
import community from "../community.json"
import { useDocsHost } from "../context.ts"

const TYPES: Record<string, string> = { docs: "Official docs", video: "Video guides", tool: "Tools", reference: "Reference" }

export function CommunityLinks() {
  const { openExternal } = useDocsHost()
  return (
    <div className="not-prose flex flex-col gap-8">
      {Object.entries(TYPES).map(([type, title]) => {
        const entries = community.entries.filter((e) => e.type === type)
        if (entries.length === 0) return null
        return (
          <section key={type}>
            <h2 className="mb-3 text-sm font-medium text-fd-foreground">{title}</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {entries.map((e) => (
                <button
                  key={e.url}
                  type="button"
                  onClick={() => openExternal(e.url)}
                  className="flex items-start justify-between gap-3 rounded-xl bg-fd-card p-3 text-left shadow-[inset_0_0_0_1px_var(--color-fd-border)] transition-transform duration-150 ease-out hover:-translate-y-0.5"
                >
                  <span className="min-w-0">
                    <span className="block text-sm text-fd-foreground">{e.title}</span>
                    <span className="mt-0.5 block text-xs text-fd-muted-foreground">by {e.creator}</span>
                  </span>
                  <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-fd-muted-foreground" />
                </button>
              ))}
            </div>
          </section>
        )
      })}
      <p className="text-xs text-fd-muted-foreground">
        Links checked {community.entries[0]?.lastChecked}. Suggesting a resource arrives with GitHub sign-in in v0.7.
      </p>
    </div>
  )
}
