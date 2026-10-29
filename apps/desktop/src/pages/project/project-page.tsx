// The open project. In v0.1 a mod has no elements yet, so this is a calm overview
// with the next step (Run). During the very first build it shows the progress screen.
import { FolderOpen, Play } from "lucide-react"
import { revealItemInDir } from "@tauri-apps/plugin-opener"
import { Button } from "@blocksy/ui"
import { FirstBuild } from "../../features/first-build/first-build"
import { runMod } from "../../shared/project-actions"
import { prettyPath } from "../../shared/paths"
import { useGradle } from "../../shared/stores/gradle"
import { useProject } from "../../shared/stores/project"
import { useSettings } from "../../shared/stores/settings"
import { Page } from "../page"

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex h-10 items-center justify-between border-b border-line-subtle text-base last:border-b-0">
      <span className="text-fg-muted">{label}</span>
      <span className="text-fg" data-selectable>
        {value}
      </span>
    </div>
  )
}

export function ProjectPage() {
  const project = useProject((s) => s.current)
  const firstBuild = useGradle((s) => s.firstBuild)
  const busy = useGradle((s) => s.task !== null)
  const home = useSettings((s) => s.home)
  if (!project) return null
  if (firstBuild) return <FirstBuild />

  const { doc, version, targetName } = project
  return (
    <Page
      title={doc.name}
      subtitle="An empty mod, ready to run. Blocks and items arrive in the next releases."
      actions={
        <Button variant="primary" className="h-7 rounded-md px-2.5" onClick={() => void runMod()} disabled={busy}>
          <Play className="fill-current" strokeWidth={0} /> Run in Minecraft
        </Button>
      }
    >
      <div className="rounded-lg px-4 shadow-[inset_0_0_0_1px_var(--b-line-subtle)]">
        <Detail label="Mod ID" value={doc.modId} />
        <Detail label="Java package" value={`${doc.group}.${doc.modId}`} />
        <Detail label="Minecraft" value={version.minecraft} />
        <Detail label="Loader" value={targetName} />
        <Detail label="Java" value={`${version.java}+`} />
      </div>
      <button
        type="button"
        onClick={() => void revealItemInDir(project.dir)}
        className="mt-4 inline-flex h-7 items-center gap-2 rounded-md px-2 text-base text-fg-muted outline-none transition-colors hover:bg-surface hover:text-fg focus-visible:shadow-[0_0_0_3px_var(--b-focus)]"
      >
        <FolderOpen className="size-3.5" strokeWidth={1.75} />
        {prettyPath(project.dir, home)}
      </button>
    </Page>
  )
}
