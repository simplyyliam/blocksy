// Community: creator spotlights (the teachers Blocksy's lessons come from), the curated community
// links, and the full credits. All of it is offline data from the docs package, and every entry
// credits its creator (plan 11.3, rule: every library and idea gets a credit).
//
//   Creator spotlight
//   [card] Modding by Kaupenjoe   Fabric tutorials for 1.21      Watch ↗
//   Community links
//   Official docs · Video guides · Tools · Reference
//   Credits
//   Teachers · Libraries · Fonts ...
import { ExternalLink } from "lucide-react"
import { COMMUNITY_ENTRIES, COMMUNITY_TYPES, CREDITS, DISCLAIMER, FEATURED } from "@blocksy/docs"
import { openUrl } from "@tauri-apps/plugin-opener"
import { Badge, Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle, toast } from "@blocksy/ui"
import { errorMessage } from "../../shared/api"

/** Loader ids in community.json, as people write them. */
const LOADER_NAMES: Record<string, string> = { fabric: "Fabric", neoforge: "NeoForge", forge: "Forge", quilt: "Quilt" }

const open = (url: string) => void openUrl(url).catch((err) => toast.error(errorMessage(err)))

function LinkRow({ title, line, url, tag }: { title: string; line: string; url: string; tag?: string }) {
  return (
    <Item
      size="xs"
      className="cursor-pointer hover:bg-surface-hover/60"
      render={<button type="button" onClick={() => open(url)} className="w-full text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/30" />}
    >
      <ItemContent>
        <ItemTitle>{title}</ItemTitle>
        <ItemDescription className="line-clamp-2">{line}</ItemDescription>
      </ItemContent>
      <ItemActions>
        {tag && <Badge variant="secondary" className="font-normal text-fg-muted">{tag}</Badge>}
        <ExternalLink className="size-3.5 text-fg-muted" strokeWidth={1.75} aria-hidden />
      </ItemActions>
    </Item>
  )
}

function Heading({ children }: { children: string }) {
  return <h2 className="mt-6 mb-2 text-sm text-fg first:mt-0">{children}</h2>
}

export function CommunityView() {
  return (
    <div className="h-full overflow-y-auto px-6 pt-3 pb-6">
      <h1 className="text-lg text-fg">Community</h1>
      <p className="mt-1 text-sm text-fg-muted">The people whose work Blocksy stands on. Links open in your browser.</p>

      <Heading>Creator spotlight</Heading>
      <div className="grid gap-2 sm:grid-cols-2">
        {FEATURED.map((c) => (
          <button
            key={c.name}
            type="button"
            onClick={() => open(c.url)}
            className="flex flex-col items-start gap-1 rounded-xl bg-subtle p-3 text-left outline-none transition-[background-color,transform] duration-150 hover:bg-surface-hover focus-visible:ring-3 focus-visible:ring-ring/30 active:scale-[0.99]"
          >
            <span className="text-sm text-fg">{c.name}</span>
            <span className="text-xs text-fg-muted">{c.work}</span>
            <span className="mt-1 line-clamp-3 text-xs text-fg-muted">{c.usedFor}</span>
          </button>
        ))}
      </div>

      {Object.entries(COMMUNITY_TYPES).map(([type, title]) => {
        const entries = COMMUNITY_ENTRIES.filter((e) => e.type === type)
        if (entries.length === 0) return null
        return (
          <section key={type}>
            <Heading>{title}</Heading>
            <ItemGroup className="gap-0.5">
              {entries.map((e) => (
                <LinkRow key={e.url} title={e.title} line={`by ${e.creator}`} url={e.url} tag={e.loaders.map((l) => LOADER_NAMES[l] ?? l).join(", ")} />
              ))}
            </ItemGroup>
          </section>
        )
      })}

      <Heading>Credits</Heading>
      {CREDITS.map((group) => (
        <section key={group.title} className="mb-3">
          <h3 className="px-2 pb-1 text-xs text-fg-muted">{group.title}</h3>
          <ItemGroup className="gap-0.5">
            {group.credits.map((c) => (
              <LinkRow key={c.name} title={c.name} line={c.usedFor} url={c.url} tag={c.license} />
            ))}
          </ItemGroup>
        </section>
      ))}
      <p className="mt-4 text-xs text-fg-muted">{DISCLAIMER}</p>
    </div>
  )
}
