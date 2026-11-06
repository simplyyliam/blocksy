// Docs page (from Home): the in-app documentation, full window. The page path lives in the
// navigation store; links inside Docs move it. Inside a project the same content is a tab.
import { useEffect } from "react"
import { DocsContent } from "../../shared/docs-app"
import { useNavigation } from "../../shared/stores/navigation"

export function DocsPage() {
  const path = useNavigation((s) => s.docsPath)
  const openDocs = useNavigation((s) => s.openDocs)

  // A new page starts at the top.
  useEffect(() => {
    document.querySelector("main")?.scrollTo({ top: 0 })
  }, [path])

  return <DocsContent path={path} navigate={openDocs} />
}
