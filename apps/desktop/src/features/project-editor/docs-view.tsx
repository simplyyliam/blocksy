// The Docs tab inside a project: the same documentation as the Docs page, but opening it never
// leaves the project (links inside it move a path kept in the editor store, not the router).
import { useEffect, useRef } from "react"
import { DocsContent } from "../../shared/docs-app"
import { useEditor } from "../../shared/stores/editor"

export function DocsView() {
  const path = useEditor((s) => s.docsPath)
  const setPath = useEditor((s) => s.setDocsPath)
  const top = useRef<HTMLDivElement>(null)
  // A new page starts at the top of the tab.
  useEffect(() => {
    top.current?.parentElement?.scrollTo({ top: 0 })
  }, [path])
  return (
    <div ref={top} className="min-h-full">
      <DocsContent path={path} navigate={setPath} />
    </div>
  )
}
