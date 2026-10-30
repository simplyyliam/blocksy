// Breadcrumbs, only in Docs ("Docs / Guides / Make a block" once Docs has sections in v0.7).
// For now Docs is one page, so this is a single quiet crumb.
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@blocksy/ui"

export function Breadcrumbs() {
  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap text-sm">
        <BreadcrumbItem>
          <BreadcrumbPage className="text-fg-muted">Docs</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
