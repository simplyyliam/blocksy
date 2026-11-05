// The Problems tab of the bottom dock: what is wrong with the project right now
// (unknown element types, data the schema rejects, a Minecraft version with no tested setup).
// It is core's validateProject, shown as a list; click a row to open that element.
import { CircleCheck, TriangleAlert } from "lucide-react"
import { useProblems } from "./use-problems"
import { useEditor } from "../../shared/stores/editor"
import { useProject } from "../../shared/stores/project"

export function Problems() {
  const problems = useProblems()
  const project = useProject((s) => s.current)
  const select = useEditor((s) => s.select)
  if (problems.length === 0) {
    return (
      <p className="flex items-center gap-2 px-4 py-3 text-sm text-fg-muted">
        <CircleCheck className="size-4 text-success" strokeWidth={1.75} /> No problems found.
      </p>
    )
  }
  // A message starts with the element's name in quotes, which lets the row open that element.
  const open = (message: string) => {
    const name = /^"(.+?)"/.exec(message)?.[1]
    const element = project?.doc.elements.find((e) => e.name === name)
    if (element) select(element.id)
  }
  return (
    <ul className="divide-y divide-line-subtle overflow-y-auto">
      {problems.map((message, i) => (
        <li key={i}>
          <button type="button" onClick={() => open(message)} className="flex w-full items-start gap-2 px-4 py-2 text-left text-sm hover:bg-surface-hover">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" strokeWidth={1.75} />
            {message}
          </button>
        </li>
      ))}
    </ul>
  )
}
