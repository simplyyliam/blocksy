// Header widget: breadcrumb on the left, actions on the right, a hairline underneath
// that runs the full width of the page column. Contents: features/header/.
import { BuildActions } from "../../features/header/build-actions"
import { Breadcrumbs } from "../../features/header/breadcrumbs"

export function Header() {
  return (
    <header className="flex h-[52px] shrink-0 items-center justify-between gap-4 border-b border-line-subtle px-2.5">
      <Breadcrumbs />
      <BuildActions />
    </header>
  )
}
