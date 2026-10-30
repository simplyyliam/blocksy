// A project's picture: its custom cover if it has one (.blocksy/cover.png in the
// project), otherwise the generated pixel cover. Used everywhere a project is shown.
import { useEffect } from "react"
import { cn, ProjectCover } from "@blocksy/ui"
import { useCovers } from "./stores/covers"

export function ProjectImage({ dir, grid, className }: { dir: string; grid?: [number, number]; className?: string }) {
  const url = useCovers((s) => s.byDir[dir])
  const load = useCovers((s) => s.load)

  useEffect(() => {
    if (dir) void load(dir)
  }, [dir, load])

  return url ? (
    <img src={url} alt="" draggable={false} className={cn("object-cover", className)} />
  ) : (
    <ProjectCover seed={dir} grid={grid} className={className} />
  )
}
