// The floating toolbar at the bottom of the canvas (a small translucent "island").
//   [≡] │ Design  Code │ ↶ ↷
// Toggle the project tree, switch views, undo and redo. Every button has a tooltip.
import { Code2, PanelLeft, Redo2, Shapes, Undo2, type LucideIcon } from "lucide-react"
import { useSyncExternalStore } from "react"
import { Button, cn, Kbd, Separator, Tooltip, TooltipContent, TooltipTrigger } from "@blocksy/ui"
import { useEditor } from "../../shared/stores/editor"
import { useProject } from "../../shared/stores/project"

function IslandButton({ label, keys, Icon, onClick, disabled, active }: { label: string; keys?: string; Icon: LucideIcon; onClick(): void; disabled?: boolean; active?: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            aria-pressed={active}
            disabled={disabled}
            onClick={onClick}
            className={cn("rounded-pill text-fg-muted", active && "bg-surface-hover text-fg")}
          />
        }
      >
        <Icon strokeWidth={1.75} />
      </TooltipTrigger>
      <TooltipContent className="flex items-center gap-2">
        {label}
        {keys && <Kbd>{keys}</Kbd>}
      </TooltipContent>
    </Tooltip>
  )
}

function ViewButton({ view, label, Icon }: { view: "design" | "code"; label: string; Icon: LucideIcon }) {
  const current = useEditor((s) => s.view)
  const setView = useEditor((s) => s.setView)
  return (
    <Button
      variant="ghost"
      size="sm"
      aria-pressed={current === view}
      onClick={() => setView(view)}
      className={cn("gap-1.5 rounded-pill px-3 text-fg-muted", current === view && "bg-surface-hover text-fg")}
    >
      <Icon strokeWidth={1.75} /> {label}
    </Button>
  )
}

export function EditorIsland() {
  const documents = useProject((s) => s.current?.documents)
  const treeOpen = useEditor((s) => s.treeOpen)
  const toggleTree = useEditor((s) => s.toggleTree)
  // Re-render when the document changes, so undo/redo enable at the right moment.
  useSyncExternalStore(
    (cb) => documents?.subscribe(cb) ?? (() => {}),
    () => documents?.get(),
  )
  if (!documents) return null
  const undoLabel = documents.undoLabel()

  return (
    <div className="pointer-events-auto flex items-center gap-1 rounded-pill bg-bg/90 p-1 shadow-lg backdrop-blur-md">
      <IslandButton label={treeOpen ? "Hide project tree" : "Show project tree"} keys="Ctrl \" Icon={PanelLeft} active={treeOpen} onClick={toggleTree} />
      <Separator orientation="vertical" className="mx-0.5 h-5 bg-line-subtle" />
      <ViewButton view="design" label="Design" Icon={Shapes} />
      <ViewButton view="code" label="Code" Icon={Code2} />
      <Separator orientation="vertical" className="mx-0.5 h-5 bg-line-subtle" />
      <IslandButton label={undoLabel ? `Undo ${undoLabel.toLowerCase()}` : "Undo"} keys="Ctrl Z" Icon={Undo2} disabled={!documents.canUndo()} onClick={() => documents.undo()} />
      <IslandButton label="Redo" keys="Ctrl Shift Z" Icon={Redo2} disabled={!documents.canRedo()} onClick={() => documents.redo()} />
    </div>
  )
}
