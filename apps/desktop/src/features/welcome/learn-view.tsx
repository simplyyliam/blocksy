// Learn: the Docs lessons. A list of lessons; picking one opens its page right here (the same Docs
// content the editor shows in its Docs tab), with a way back to the list.
//
//   Lessons
//   ① Make your first block     A textured block in its own creative tab...      →
//   ② Make your first item      Paint an item, craft it, cook it, eat it...      →
//   ── pick one ──►  [← Lessons]   the lesson page (scrolls)
import { ArrowLeft, ChevronRight } from "lucide-react"
import { useEffect, useRef } from "react"
import { lessonPath, LESSONS } from "@blocksy/docs"
import { Button, Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@blocksy/ui"
import { DocsContent } from "../../shared/docs-app"
import { useWelcome } from "../../shared/stores/welcome"

export function LearnView() {
  const path = useWelcome((s) => s.learnPath)
  const openLearn = useWelcome((s) => s.openLearn)
  const top = useRef<HTMLDivElement>(null)

  // A new page starts at the top.
  useEffect(() => {
    top.current?.scrollTo({ top: 0 })
  }, [path])

  if (path) {
    return (
      <div className="flex h-full flex-col">
        <div className="shrink-0 px-3 pb-1">
          <Button variant="ghost" size="sm" onClick={() => openLearn(null)} className="text-fg-muted">
            <ArrowLeft strokeWidth={1.75} /> Lessons
          </Button>
        </div>
        <div ref={top} className="min-h-0 flex-1 overflow-y-auto">
          {/* Links inside a lesson move around the Docs; the Docs start page is the lesson list. */}
          <DocsContent path={path} navigate={(to) => openLearn(to === "/docs" ? null : to)} />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto px-6 pt-3 pb-6">
      <h1 className="text-lg text-fg">Lessons</h1>
      <p className="mt-1 text-sm text-fg-muted">Short, hands-on lessons. Each one makes something real and shows you the Java behind it.</p>
      <ItemGroup className="mt-4 gap-1">
        {LESSONS.map((lesson, i) => (
          <Item
            key={lesson.slug}
            size="sm"
            className="cursor-pointer hover:bg-surface-hover/60"
            render={<button type="button" onClick={() => openLearn(lessonPath(lesson.slug))} className="w-full text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/30" />}
          >
            <ItemMedia className="size-7 rounded-md bg-subtle text-sm text-fg-muted">{i + 1}</ItemMedia>
            <ItemContent>
              <ItemTitle>{lesson.title}</ItemTitle>
              <ItemDescription className="line-clamp-2">{lesson.about}</ItemDescription>
            </ItemContent>
            <ItemActions>
              <ChevronRight className="size-4 text-fg-muted" strokeWidth={1.75} />
            </ItemActions>
          </Item>
        ))}
      </ItemGroup>
    </div>
  )
}
