// The project editor (plan v0.2 "Project editor layout"): canvas first, calm, borderless.
//
//   ┌ tree ─────┬ canvas (soft surface) ────────────────────────┐
//   │ Overview  │                              ┌ inspector ──┐ │
//   │ BLOCKS  + │          [ 3D block ]        │ floats here │ │
//   │  ▣ Ruby   │                              │ when picked │ │
//   │ TABS    + │                              └─────────────┘ │
//   │           │        ( ≡ │ Design Code │ ↶ ↷ )  <- island  │
//   └───────────┴───────────────────────────────────────────────┘
// Element canvases and inspectors come from element packages (app/modules.ts), so new
// element types appear here without changes. The status bar sits below (App.tsx).
import { AnimatePresence, motion } from "motion/react"
import { useEffect } from "react"
import { renameElement, updateElement, type Element } from "@blocksy/core"
import { FirstBuild } from "../../features/first-build/first-build"
import { CodeTab } from "../../features/project-editor/code-tab"
import { EditorIsland } from "../../features/project-editor/editor-island"
import { Overview } from "../../features/project-editor/overview"
import { ProjectTree } from "../../features/project-editor/project-tree"
import { elementModules } from "../../app/modules"
import { useEditor } from "../../shared/stores/editor"
import { useGradle } from "../../shared/stores/gradle"
import { useProject, type OpenProject } from "../../shared/stores/project"

/** Undo/redo and tree toggle from the keyboard, except while typing in a field. */
function useShortcuts(project: OpenProject | null) {
  const toggleTree = useEditor((s) => s.toggleTree)
  useEffect(() => {
    if (!project) return
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && e.target.closest("input, textarea, [contenteditable]")
      if (!(e.ctrlKey || e.metaKey) || typing) return
      const key = e.key.toLowerCase()
      if (key === "z" && !e.shiftKey) project.documents.undo()
      else if ((key === "z" && e.shiftKey) || key === "y") project.documents.redo()
      else if (key === "\\") toggleTree()
      else return
      e.preventDefault()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [project, toggleTree])
}

/** The props every element canvas and inspector receives (core's ElementEditorProps). */
function editorProps(project: OpenProject, element: Element, select: (id: string) => void) {
  return {
    element,
    project: project.doc,
    change: (data: unknown) => project.documents.execute(updateElement(element.id, data)),
    rename: (name: string) => project.documents.execute(renameElement(element.id, name)),
    select,
  }
}

export function ProjectPage() {
  const project = useProject((s) => s.current)
  const firstBuild = useGradle((s) => s.firstBuild)
  const { selected, view, treeOpen, select } = useEditor()
  useShortcuts(project)

  // A freshly opened project starts on its Overview.
  const dir = project?.dir
  useEffect(() => {
    useEditor.setState({ selected: "overview", view: "design" })
  }, [dir])

  if (!project) return null
  if (firstBuild) return <FirstBuild />

  const element = project.doc.elements.find((e) => e.id === selected)
  const module = element && elementModules.get(element.type)
  const props = element && editorProps(project, element, select)

  return (
    <div className="flex h-full min-h-0 gap-2.5 pb-1">
      {/* The project tree: one quiet column, collapsible (Ctrl+\). */}
      <AnimatePresence initial={false}>
        {treeOpen && (
          <motion.aside
            key="tree"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 212, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="shrink-0 overflow-x-hidden overflow-y-auto"
          >
            <div className="w-[212px] pr-1">
              <ProjectTree />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* The canvas: the work fills the page; tools float above it. */}
      <section className="relative min-w-0 flex-1 overflow-hidden rounded-xl bg-subtle" aria-label="Canvas">
        <div className="absolute inset-0 overflow-y-auto">
          {view === "code" ? (
            <CodeTab />
          ) : module && props ? (
            <module.Canvas key={element.id} {...props} />
          ) : (
            <Overview />
          )}
        </div>

        {/* The inspector floats on the right, only while something is selected. */}
        <AnimatePresence>
          {view === "design" && module && props && (
            <motion.aside
              key={element.id}
              aria-label={`${module.type.name} inspector`}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute top-2.5 right-2.5 bottom-16 w-[300px] overflow-y-auto rounded-xl bg-bg/90 p-4 shadow-lg backdrop-blur-md"
            >
              <module.Inspector {...props} />
            </motion.aside>
          )}
        </AnimatePresence>

        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
          <EditorIsland />
        </div>
      </section>
    </div>
  )
}
