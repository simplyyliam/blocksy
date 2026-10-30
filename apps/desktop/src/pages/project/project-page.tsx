// The project editor (plan v0.2 "Project editor layout"): canvas first, calm, borderless.
//
//   ┌ canvas (soft grey surface) ─────────────────────────────────┐
//   │ ┌ tree card ┐                               ┌ inspector ──┐ │
//   │ │ Ruby Mod  │          [ 3D block ]         │ card, only  │ │
//   │ │ Blocks  + │                               │ when picked │ │
//   │ └───────────┘   ( ≡ │ Design Code │ ↶ ↷ )   └─────────────┘ │
//   └─────────────────────────────────────────────────────────────┘
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

  // Cards float over the canvas (docs/design/visual-editor(assets).jpg): white, rounded, soft shadow.
  const card = "absolute top-2.5 bottom-2.5 overflow-hidden rounded-2xl bg-bg shadow-lg"
  const ease = [0.22, 1, 0.36, 1] as const

  return (
    <section className="relative h-full min-h-0 overflow-hidden rounded-2xl bg-surface" aria-label="Canvas">
      {/* The work fills the page: the selected element's canvas, its code, or the overview. */}
      <div className="absolute inset-0 overflow-y-auto">
        {view === "code" ? (
          <div className={treeOpen ? "pl-[252px]" : ""}>
            <CodeTab />
          </div>
        ) : module && props ? (
          // No key: switching between two blocks keeps the same 3D canvas (no new WebGL context).
          <module.Canvas {...props} />
        ) : (
          <Overview />
        )}
      </div>

      {/* The project tree card, collapsible (Ctrl+\). */}
      <AnimatePresence initial={false}>
        {treeOpen && (
          <motion.aside
            key="tree"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2, ease }}
            className={`${card} left-2.5 w-[232px]`}
          >
            <ProjectTree />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* The inspector card floats on the right, only while something is selected. */}
      <AnimatePresence>
        {view === "design" && module && props && (
          <motion.aside
            key={element.id}
            aria-label={`${module.type.name} inspector`}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.2, ease }}
            className={`${card} right-2.5 w-[300px] overflow-x-hidden overflow-y-auto`}
          >
            <module.Inspector {...props} />
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
        <EditorIsland />
      </div>
    </section>
  )
}
