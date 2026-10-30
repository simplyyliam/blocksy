// Breadcrumbs, only in Docs: "Docs / Learn / Make your first block".
// Built from the docs path; the first crumb goes back to the Docs start page.
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@blocksy/ui"
import { useNavigation } from "../../shared/stores/navigation"

/** "make-your-first-block" -> "Make your first block" */
const label = (slug: string) => {
  const words = slug.replaceAll("-", " ")
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export function Breadcrumbs() {
  const path = useNavigation((s) => s.docsPath)
  const openDocs = useNavigation((s) => s.openDocs)
  const parts = path.replace(/^\/docs\/?/, "").split("/").filter(Boolean)
  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap text-sm">
        <BreadcrumbItem>
          {parts.length === 0 ? (
            <BreadcrumbPage className="text-fg-muted">Docs</BreadcrumbPage>
          ) : (
            <BreadcrumbLink render={<button type="button" onClick={() => openDocs("/docs")} />}>Docs</BreadcrumbLink>
          )}
        </BreadcrumbItem>
        {parts.map((part, i) => (
          <span key={part} className="contents">
            <BreadcrumbSeparator />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className={i === parts.length - 1 ? "truncate text-fg" : "truncate text-fg-muted"}>{label(part)}</BreadcrumbPage>
            </BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
