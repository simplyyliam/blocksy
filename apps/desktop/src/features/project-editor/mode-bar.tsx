// The mode bar at the right end of the tab row:
//   [Paint | Look]  │  [Design | Code]
// Left: the working modes of the selected element (Item: Paint, Look; Block: Paint, Model, Look).
// Elements without modes (recipe, creative tab, tag, language) show only the view switch.
// Right: Design (the editor) or Code (every generated file of the project).
import { Code2, Shapes } from "lucide-react"
import { Button, cn, Separator } from "@blocksy/ui"
import { elementModules } from "../../app/modules"
import { useEditor } from "../../shared/stores/editor"
import { useProject } from "../../shared/stores/project"

interface Segment {
  id: string
  label: string
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
}

function Segmented({ label, items, value, onChange }: { label: string; items: Segment[]; value: string; onChange(id: string): void }) {
  return (
    <div role="group" aria-label={label} className="flex items-center rounded-md bg-surface-hover/70 p-px">
      {items.map(({ id, label: text, Icon }) => (
        <Button
          key={id}
          variant="ghost"
          size="xs"
          aria-pressed={value === id}
          onClick={() => onChange(id)}
          className={cn("h-5.5 gap-1 rounded-[5px] px-2 text-xs text-fg-muted hover:text-fg", value === id && "bg-bg text-fg shadow-xs")}
        >
          <Icon className="size-3" strokeWidth={1.75} /> {text}
        </Button>
      ))}
    </div>
  )
}

export function ModeBar() {
  const project = useProject((s) => s.current)
  const selected = useEditor((s) => s.selected)
  const view = useEditor((s) => s.view)
  const setView = useEditor((s) => s.setView)
  const modeByType = useEditor((s) => s.modeByType)
  const setMode = useEditor((s) => s.setMode)
  const element = project?.doc.elements.find((e) => e.id === selected)
  const modes = element ? elementModules.get(element.type)?.modes : undefined

  return (
    <div className="flex shrink-0 items-center gap-1.5 pr-1 pb-1">
      {element && modes && view === "design" && (
        <>
          <Segmented label="Mode" items={modes} value={modeByType[element.type] ?? modes[0]!.id} onChange={(id) => setMode(element.type, id)} />
          <Separator orientation="vertical" className="h-4 bg-line-subtle" />
        </>
      )}
      <Segmented
        label="View"
        items={[
          { id: "design", label: "Design", Icon: Shapes },
          { id: "code", label: "Code", Icon: Code2 },
        ]}
        value={view}
        onChange={(id) => setView(id as "design" | "code")}
      />
    </div>
  )
}
