// The Docs shell: Fumadocs (layout, sidebar, table of contents, MDX) inside Blocksy.
// A thin adapter (plan rule 6): the app only sees <DocsApp>, never Fumadocs.
//
//   ┌ sidebar ────────┬ page ─────────────────────────┬ on this page ┐
//   │ Learn           │ Make your first block         │ Fields       │
//   │ Guides          │ [live demo] [video lesson]    │ ...          │
//   │ Reference       │ ...                           │              │
//   │ Concepts        │ ── credits footer ──          │              │
//   │ Community       │                               │              │
//   └─────────────────┴───────────────────────────────┴──────────────┘
//
// Blocksy has no URL router: the app keeps the docs path in its navigation store and
// hands it in, and Fumadocs' FrameworkProvider asks us for it (usePathname, Link, push).
// Pages: MDX files in ../content, plus Reference pages generated from element types.
import { FrameworkProvider } from "fumadocs-core/framework"
import { loader, multiple, type VirtualFile } from "fumadocs-core/source"
import { DocsLayout } from "fumadocs-ui/layouts/docs"
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page"
import defaultMdxComponents from "fumadocs-ui/mdx"
import { Step, Steps } from "fumadocs-ui/components/steps"
import { RootProvider } from "fumadocs-ui/provider/base"
import { Suspense, use, useMemo, type ComponentProps } from "react"
import type { ElementType } from "@blocksy/core"
import { PixelLoader } from "@blocksy/ui"
import { BlockDemo } from "./components/block-demo.tsx"
import { CommunityLinks } from "./components/community-links.tsx"
import { CreditsFooter, CreditsList } from "./components/credits.tsx"
import { ElementReference } from "./components/element-reference.tsx"
import { VideoLesson } from "./components/video-lesson.tsx"
import { docs } from "./content.ts"
import { DocsHostContext, useDocsHost, type DocsHost } from "./context.ts"

// --- Framework adapter: Fumadocs asks Blocksy where we are and how to move ---

function usePathname() {
  return useDocsHost().path
}

function useRouter() {
  const { navigate } = useDocsHost()
  return useMemo(() => ({ push: navigate, refresh: () => {} }), [navigate])
}

const useParams = () => ({})

/** Links: web links open in the browser, docs links move inside the Docs. */
function DocsLink({ href = "", onClick, ...props }: ComponentProps<"a">) {
  const { navigate, openExternal } = useDocsHost()
  return (
    <a
      href={href}
      {...props}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented || href.startsWith("#")) return // in-page anchors scroll as usual
        e.preventDefault()
        if (/^https?:\/\//.test(href)) openExternal(href)
        else navigate(href)
      }}
    />
  )
}

// --- Pages ---

/** One generated Reference page per registered element type that has docs data. */
function referencePages(types: ElementType[]): VirtualFile[] {
  return types
    .filter((t) => t.docs)
    .map((t) => ({
      type: "page" as const,
      path: `reference/${t.id.replaceAll("_", "-")}.mdx`,
      data: { title: t.name, description: `Every field of the ${t.name} element, and the Java it becomes.`, elementType: t.id },
    }))
}

/** Components MDX pages can use, on top of Fumadocs' defaults (Callout, Cards, ...). */
const mdxComponents = { ...defaultMdxComponents, a: DocsLink, Steps, Step, VideoLesson, BlockDemo, CreditsList, CommunityLinks }

interface MdxEntry {
  load(): Promise<{ toc: ComponentProps<typeof DocsPage>["toc"] }>
  body: React.ComponentType<{ components?: Record<string, unknown> }>
}

/** An MDX page: its content loads lazily, so it suspends until ready. */
function MdxPage({ entry, title, description }: { entry: MdxEntry; title: string; description?: string }) {
  const { toc } = use(entry.load())
  const Body = entry.body
  return (
    <DocsPage toc={toc} tableOfContent={{ style: "clerk" }}>
      <PageHeader title={title} description={description} />
      <DocsBody>
        <Body components={mdxComponents} />
        <CreditsFooter />
      </DocsBody>
    </DocsPage>
  )
}

function PageHeader({ title, description }: { title: string; description?: string }) {
  const { version } = useDocsHost()
  return (
    <>
      {/* Version badge on every page, like Fabric's docs. */}
      <span className="not-prose mb-1 w-fit rounded-md bg-fd-muted px-1.5 py-0.5 text-xs text-fd-muted-foreground">
        Blocksy {version} · Fabric · Minecraft 26.1+
      </span>
      <DocsTitle>{title}</DocsTitle>
      {description && <DocsDescription>{description}</DocsDescription>}
    </>
  )
}

function PageLoading() {
  return (
    <div className="grid min-h-[40vh] flex-1 place-items-center">
      <PixelLoader className="size-6 text-fd-primary" label="Loading page" />
    </div>
  )
}

// --- The shell ---

export function DocsApp(host: DocsHost) {
  const { elementTypes, path } = host
  const source = useMemo(
    () =>
      loader({
        baseUrl: "/docs",
        source: multiple({ mdx: docs.toFumadocsSource(), reference: { files: referencePages(elementTypes) } }),
      }),
    [elementTypes],
  )
  const slugs = path.replace(/^\/docs\/?/, "").split("/").filter(Boolean)
  const page = source.getPage(slugs) ?? source.getPage([])

  let content: React.ReactNode = <p>This page doesn't exist yet.</p>
  if (page) {
    const data = page.data as unknown as { type: string; title?: string; description?: string; elementType?: string }
    if (data.type === "reference") {
      const type = elementTypes.find((t) => t.id === data.elementType)!
      content = (
        <DocsPage toc={[{ title: "Fields", url: "#fields", depth: 2 }, { title: "In Blocksy", url: "#in-blocksy", depth: 2 }]} tableOfContent={{ style: "clerk" }}>
          <PageHeader title={data.title ?? type.name} description={data.description} />
          <DocsBody>
            <ElementReference type={type} />
            <CreditsFooter />
          </DocsBody>
        </DocsPage>
      )
    } else {
      content = (
        <Suspense key={page.url} fallback={<PageLoading />}>
          <MdxPage entry={page.data as unknown as MdxEntry} title={data.title ?? ""} description={data.description} />
        </Suspense>
      )
    }
  }

  return (
    <DocsHostContext value={host}>
      <FrameworkProvider usePathname={usePathname} useRouter={useRouter} useParams={useParams} Link={DocsLink}>
        {/* Blocksy owns themes and search arrives in v0.7, so both are off in Fumadocs. */}
        <RootProvider theme={{ enabled: false }} search={{ enabled: false }}>
          <DocsLayout
            tree={source.pageTree}
            nav={{ enabled: false }}
            themeSwitch={{ enabled: false }}
            searchToggle={{ enabled: false }}
            sidebar={{ collapsible: false }}
          >
            {content}
          </DocsLayout>
        </RootProvider>
      </FrameworkProvider>
    </DocsHostContext>
  )
}
