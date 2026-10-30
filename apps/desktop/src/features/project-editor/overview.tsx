// Overview: the project's facts (the v0.1 project details), now a page inside the
// editor instead of the first thing you see. Right-click a row to copy its value.
import { Box, Copy, FolderOpen, Play } from "lucide-react"
import { revealItemInDir } from "@tauri-apps/plugin-opener"
import { Button, ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, toast } from "@blocksy/ui"
import { runMod } from "../../shared/project-actions"
import { prettyPath } from "../../shared/paths"
import { useEditor } from "../../shared/stores/editor"
import { useGradle } from "../../shared/stores/gradle"
import { useProject } from "../../shared/stores/project"
import { useSettings } from "../../shared/stores/settings"

function Detail({ label, value }: { label: string; value: string }) {
  const copy = async () => {
    await navigator.clipboard.writeText(value)
    toast(`Copied ${label.toLowerCase()}`)
  }
  return (
    <ContextMenu>
      <ContextMenuTrigger render={<div className="flex h-10 items-center justify-between gap-6 border-b border-line-subtle text-base last:border-b-0" />}>
        <span className="shrink-0 text-fg-muted">{label}</span>
        <span className="min-w-0 truncate text-fg" title={value} data-selectable>
          {value}
        </span>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-44">
        <ContextMenuItem onClick={() => void copy()}>
          <Copy strokeWidth={1.75} /> Copy {label.toLowerCase()}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

export function Overview() {
  const project = useProject((s) => s.current)
  const busy = useGradle((s) => s.task !== null)
  const home = useSettings((s) => s.home)
  const select = useEditor((s) => s.select)
  if (!project) return null
  const { doc, version, targetName } = project
  const blocks = doc.elements.filter((e) => e.type === "block")

  return (
    <div className="mx-auto w-full max-w-[640px] px-6 pt-10 pb-24">
      <h1 className="text-xl font-medium tracking-[-0.01em] break-words text-fg">{doc.name}</h1>
      <p className="mt-1.5 text-base text-fg-muted">
        {blocks.length === 0
          ? "No blocks yet. Add one from the project tree on the left."
          : `${blocks.length} block${blocks.length === 1 ? "" : "s"}. Run it to try ${blocks.length === 1 ? "it" : "them"} in Minecraft.`}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => void runMod()} disabled={busy}>
          <Play className="fill-current" strokeWidth={0} /> Run in Minecraft
        </Button>
        {blocks[0] && (
          <Button variant="secondary" size="sm" onClick={() => select(blocks[0]!.id)}>
            <Box strokeWidth={1.75} /> Open {blocks[0].name}
          </Button>
        )}
      </div>

      <div className="mt-8 rounded-lg bg-bg px-4 shadow-[inset_0_0_0_1px_var(--b-line-subtle)]">
        <Detail label="Mod ID" value={doc.modId} />
        <Detail label="Java package" value={`${doc.group}.${doc.modId}`} />
        <Detail label="Minecraft" value={version.minecraft} />
        <Detail label="Loader" value={targetName} />
        <Detail label="Java" value={`${version.java}+`} />
      </div>
      <Button variant="ghost" size="sm" onClick={() => void revealItemInDir(project.dir)} className="mt-4 h-auto min-h-8 max-w-full justify-start py-1.5 text-left font-normal whitespace-normal text-fg-muted">
        <FolderOpen strokeWidth={1.75} />
        <span className="min-w-0 wrap-anywhere">{prettyPath(project.dir, home)}</span>
      </Button>
    </div>
  )
}
