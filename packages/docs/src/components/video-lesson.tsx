// A video lesson card: thumbnail first (nothing loads from YouTube until you press
// play), then the video inline, always with a credit and an "Open on YouTube" link.
// Used for Kaupenjoe's lessons in the Learn section.
import { ExternalLink, Play } from "lucide-react"
import { useState, type ReactNode } from "react"
import { useDocsHost } from "../context.ts"

interface VideoLessonProps {
  /** YouTube video id (checked to exist with YouTube's oEmbed). */
  id: string
  title: string
  creator: string
  /** One line on what this video adds to the lesson. */
  children?: ReactNode
}

export function VideoLesson({ id, title, creator, children }: VideoLessonProps) {
  const { openExternal } = useDocsHost()
  const [playing, setPlaying] = useState(false)
  const url = `https://www.youtube.com/watch?v=${id}`
  return (
    <figure className="not-prose my-6 overflow-hidden rounded-xl bg-fd-card shadow-[inset_0_0_0_1px_var(--color-fd-border)]">
      <div className="relative aspect-video bg-fd-muted">
        {playing ? (
          <iframe
            className="absolute inset-0 size-full"
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title={title}
            referrerPolicy="strict-origin-when-cross-origin"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0 size-full" aria-label={`Play ${title}`}>
            <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" className="size-full object-cover" loading="lazy" />
            <span className="absolute inset-0 grid place-items-center bg-black/20 transition-colors duration-200 group-hover:bg-black/30">
              <span className="grid size-14 place-items-center rounded-full bg-white/90 text-black shadow-lg transition-transform duration-200 ease-out group-hover:scale-105">
                <Play className="ml-0.5 size-6 fill-current" strokeWidth={0} />
              </span>
            </span>
          </button>
        )}
      </div>
      <figcaption className="flex items-start justify-between gap-4 px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-fd-foreground">{title}</p>
          {/* A div, not a p: MDX wraps the children in their own paragraph. */}
          <div className="mt-0.5 flex flex-wrap gap-x-1 text-xs text-fd-muted-foreground [&_p]:m-0">
            <span>
              Video by <span className="text-fd-foreground">{creator}</span>
              {children ? " ·" : ""}
            </span>
            {children}
          </div>
        </div>
        <button
          type="button"
          onClick={() => openExternal(url)}
          className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground"
        >
          Open on YouTube <ExternalLink className="size-3" />
        </button>
      </figcaption>
    </figure>
  )
}
