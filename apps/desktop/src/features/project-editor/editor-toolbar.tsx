// The editor toolbar under the tabs (32px, --b-toolbar-h). It moved out of the tab row, so many
// open tabs can never push the mode controls away (ADR 0019).
//   Blocks › Ruby Block                         [Paint | Model | Look] │ [Design | Code]
// Left: where you are (breadcrumb). Right: the working modes of the selected element
// (Item: Paint, Look; Block: Paint, Model, Look; none for recipe, tab, tag, language), then
// Design (the editor) or Code (every generated file of the project).
import { ChevronRight, Code2, Shapes } from "lucide-react"
import { Button, cn, Separator } from "@blocksy/ui"
import { elementModules, registries } from "../../app/modules"
import { DOCS, HISTORY, LIBRARY, OVERVIEW, useEditor } from "../../shared/stores/editor"
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

const VIEW_NAMES: Record<string, string> = { [OVERVIEW]: "Overview", [LIBRARY]: "Library", [HISTORY]: "History", [DOCS]: "Docs" }

export function EditorToolbar() {
  const project = useProject((s) => s.current)
  const selected = useEditor((s) => s.selected)
  const view = useEditor((s) => s.view)
  const setView = useEditor((s) => s.setView)
  const modeByType = useEditor((s) => s.modeByType)
  const setMode = useEditor((s) => s.setMode)
  const element = project?.doc.elements.find((e) => e.id === selected)
  const type = element && registries.elementTypes.get(element.type)
  const modes = element ? elementModules.get(element.type)?.modes : undefined

  return (
    <div className="flex h-(--b-toolbar-h) shrink-0 items-center justify-between gap-3 border-b border-line-subtle px-3">
      {/* Breadcrumb: group › element, or just the view's name. */}
      <nav aria-label="Location" className="flex min-w-0 items-center gap-1 text-sm text-fg-muted">
        {element && type ? (
          <>
            <span className="truncate">{type.plural ?? type.name}</span>
            <ChevronRight className="size-3 shrink-0 text-fg-faint" strokeWidth={2} />
            <span className="truncate text-fg">{element.name}</span>
          </>
        ) : (
          <span className="truncate text-fg">{VIEW_NAMES[selected] ?? selected}</span>
        )}
      </nav>
      <div className="flex shrink-0 items-center gap-1.5">
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
    </div>
  )
}
