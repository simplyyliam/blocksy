// The first-launch Projects view: no projects yet, so a friendly welcome and the three ways to start
// (JetBrains shows New / Open / Get from VCS here). A calm dot pattern sits behind it ("make it alive").
//
//            [Blocksy mark]
//         Welcome to Blocksy
//   Make Minecraft mods with visual editors,
//        and learn Java along the way.
//   [ + New project ] [ 📂 Open folder ] [ ⑂ Clone ]
//   New here? Start "Make your first block" →
import { FolderOpen, GitBranch, Plus, type LucideIcon } from "lucide-react"
import { lessonPath, LESSONS } from "@blocksy/docs"
import { DotPattern, Kbd } from "@blocksy/ui"
import { useJava } from "../../shared/stores/java"
import { useWelcome } from "../../shared/stores/welcome"
import { openFolder } from "./actions"

function Tile({ Icon, label, keys, onClick }: { Icon: LucideIcon; label: string; keys: string; onClick(): void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-[140px] flex-col items-center gap-2 rounded-lg bg-subtle px-3 py-4 text-sm text-fg outline-none transition-[background-color,transform] duration-150 hover:bg-surface-hover focus-visible:ring-3 focus-visible:ring-ring/30 active:scale-[0.98]"
    >
      <span className="grid size-9 place-items-center rounded-lg bg-surface text-fg">
        <Icon className="size-4.5" strokeWidth={1.75} />
      </span>
      {label}
      <Kbd>{keys}</Kbd>
    </button>
  )
}

export function EmptyState() {
  const setCreating = useWelcome((s) => s.setCreating)
  const setCloning = useWelcome((s) => s.setCloning)
  const openSettings = useWelcome((s) => s.openSettings)
  const openLearn = useWelcome((s) => s.openLearn)
  const first = LESSONS[0]
  const javaMissing = useJava((s) => s.status === "missing")
  const javaRequired = useJava((s) => s.required)
  return (
    <div className="relative grid h-full place-items-center overflow-hidden px-6">
      <DotPattern className="absolute inset-0 size-full text-fg/10 [mask-image:radial-gradient(320px_circle_at_center,white,transparent)]" />
      <div className="relative flex flex-col items-center text-center">
        <img src="/favicon.svg" alt="" className="size-10" draggable={false} />
        <h1 className="mt-4 text-xl font-medium tracking-[-0.01em] text-fg">Welcome to Blocksy</h1>
        <p className="mt-1.5 max-w-[34ch] text-base text-fg-muted">Make Minecraft mods with visual editors, and learn Java along the way.</p>
        <div className="mt-6 flex gap-3">
          <Tile Icon={Plus} label="New project" keys="Ctrl+N" onClick={() => setCreating(true)} />
          <Tile Icon={FolderOpen} label="Open folder" keys="Ctrl+O" onClick={() => void openFolder()} />
          <Tile Icon={GitBranch} label="Clone" keys="Ctrl+Shift+O" onClick={() => setCloning(true)} />
        </div>
        {first && (
          <p className="mt-6 text-sm text-fg-muted">
            New here?{" "}
            <button type="button" onClick={() => openLearn(lessonPath(first.slug))} className="text-brand underline-offset-4 outline-none hover:underline focus-visible:underline">
              Start “{first.title}”
            </button>
          </p>
        )}
        {/* The one thing to say about Java at first launch: only when it is missing. */}
        {javaMissing && (
          <p className="mt-2 text-sm text-fg-muted">
            Blocksy needs Java {javaRequired} to build mods.{" "}
            <button type="button" onClick={() => openSettings("java")} className="text-brand underline-offset-4 outline-none hover:underline focus-visible:underline">
              Set up Java
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
