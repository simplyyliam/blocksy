// Header widget: project on the left, actions on the right. Contents: features/header/.
import { BuildActions } from "../../features/header/build-actions"
import { ProjectPill } from "../../features/header/project-pill"

export function Header() {
  return (
    <header className="flex h-7 shrink-0 items-center justify-between gap-4">
      <ProjectPill />
      <BuildActions />
    </header>
  )
}
