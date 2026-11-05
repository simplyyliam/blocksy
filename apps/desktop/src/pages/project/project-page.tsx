// The project editor (plan v0.2 "Project editor layout"): canvas first, calm, borderless.
//
//   ┌ tree ─────┬ canvas (soft grey surface) ─────┬ inspector ──┐
//   │ Ruby Mod  │                                 │ Block       │
//   │ Blocks  + │          [ 3D block ]           │ Name  [   ] │
//   │  ▣ Ruby   │                                 │ Mining      │
//   │           │   ( ≡ │ Design Code │ ↶ ↷ )     │ (when picked)│
//   └───────────┴─────────────────────────────────┴─────────────┘
// Tree and inspector are flush on the white page (Liam preferred it to floating cards).
// Element canvases and inspectors come from element packages (app/modules.ts), so new
// element types appear here without changes. The status bar sits below (App.tsx).
import { useEffect } from "react"
import { renameElement, updateElement, type Element } from "@blocksy/core"
import { cn, ResizableHandle, ResizablePanel, ResizablePanelGroup, usePanelRef } from "@blocksy/ui"
import { FirstBuild } from "../../features/first-build/first-build"
import { CodeTab } from "../../features/project-editor/code-tab"
import { History } from "../../features/project-editor/history"
import { Overview } from "../../features/project-editor/overview"
import { ProjectTree } from "../../features/project-editor/project-tree"
import { TabStrip } from "../../features/project-editor/tab-strip"
import { elementModules, registries } from "../../app/modules"
import { useLayoutMemory } from "../../shared/layout-memory"
import { HISTORY, useEditor } from "../../shared/stores/editor"
import { playMinecraftSound } from "../../shared/minecraft-sounds"
import { useGradle } from "../../shared/stores/gradle"
import { useProject, type OpenProject } from "../../shared/stores/project"

/** The props every element canvas and inspector receives (core's ElementEditorProps). */
function editorProps(project: OpenProject, element: Element, select: (id: string) => void) {
  return {
    element,
    project: project.doc,
    change: (data: unknown) => project.documents.execute(updateElement(element.id, data)),
    rename: (name: string) => project.documents.execute(renameElement(element.id, name)),
    select,
    // v0.3: editors that read other elements (the lang editor) get every element type.
    elementTypes: registries.elementTypes.list(),
    // v0.3: hear vanilla sounds (block sound types) from the player's own Minecraft download.
    playSound: playMinecraftSound,
  }
}

export function ProjectPage() {
  const project = useProject((s) => s.current)
  const firstBuild = useGradle((s) => s.firstBuild)
  const { selected, view, treeOpen, inspectorOpen, inspectorSide, treeWidth, inspectorWidth, select } = useEditor()
  const setLayout = useEditor((s) => s.setLayout)

  // A freshly opened project starts on its Overview tab, with its remembered panel layout.
  const dir = project?.dir
  useEffect(() => {
    useEditor.getState().resetTabs()
  }, [dir])
  const layoutReady = useLayoutMemory(dir)

  // Menu and keyboard toggles (editor store) collapse or expand the panels.
  const treeRef = usePanelRef()
  const inspectorRef = usePanelRef()
  const showInspectorNow = inspectorOpen && view === "design"
  useEffect(() => {
    const panel = treeRef.current
    if (!panel) return
    if (treeOpen && panel.isCollapsed()) panel.expand()
    else if (!treeOpen && !panel.isCollapsed()) panel.collapse()
  }, [treeOpen, layoutReady, treeRef])
  useEffect(() => {
    const panel = inspectorRef.current
    if (!panel) return
    if (showInspectorNow && panel.isCollapsed()) panel.expand()
    else if (!showInspectorNow && !panel.isCollapsed()) panel.collapse()
  }, [showInspectorNow, layoutReady, inspectorRef])

  // Elements can vanish (delete, undo of a create): close their tabs.
  const doc = project?.doc
  useEffect(() => {
    if (doc) useEditor.getState().pruneTabs(new Set(doc.elements.map((e) => e.id)))
  }, [doc])

  if (!project) return null
  if (firstBuild) return <FirstBuild />
  if (!layoutReady) return null // a few milliseconds: the saved panel sizes are being read

  const element = project.doc.elements.find((e) => e.id === selected)
  const module = element && elementModules.get(element.type)
  const props = element && editorProps(project, element, select)
  const showInspector = inspectorOpen && view === "design"

  // Panels stay mounted (the 3D canvas must not restart) and collapse to 0 instead.
  // Sizes are pixels; resizing writes them back, so they are remembered per project.
  const tree = (
    <ResizablePanel
      id="tree"
      key="tree"
      panelRef={treeRef}
      collapsible
      collapsedSize={0}
      defaultSize={treeOpen ? treeWidth : 0}
      minSize={170}
      maxSize={440}
      groupResizeBehavior="preserve-pixel-size"
      onResize={(size) => (size.inPixels === 0 ? useEditor.getState().treeOpen && setLayout({ treeOpen: false }) : setLayout({ treeOpen: true, treeWidth: Math.round(size.inPixels) }))}
    >
      <ProjectTree />
    </ResizablePanel>
  )
  const inspector = (
    <ResizablePanel
      id="inspector"
      key="inspector"
      panelRef={inspectorRef}
      collapsible
      collapsedSize={0}
      defaultSize={showInspector ? inspectorWidth : 0}
      minSize={240}
      maxSize={520}
      groupResizeBehavior="preserve-pixel-size"
      onResize={(size) => (size.inPixels === 0 ? useEditor.getState().inspectorOpen && useEditor.getState().view === "design" && setLayout({ inspectorOpen: false }) : setLayout({ inspectorOpen: true, inspectorWidth: Math.round(size.inPixels) }))}
    >
      <aside aria-label="Inspector" className="h-full overflow-x-hidden overflow-y-auto">
        {module && props ? (
          <div key={element.id}>
            <module.Inspector {...props} />
          </div>
        ) : (
          <p className="px-4 py-3 text-sm text-fg-faint">Open an element to edit its properties here.</p>
        )}
      </aside>
    </ResizablePanel>
  )
  const centre = (
    <ResizablePanel id="centre" key="centre" minSize={320}>
      <div className="flex h-full min-h-0 flex-col">
        <TabStrip />
        {/* The canvas: the work fills it; element tools float on it. */}
        <section className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-surface" aria-label="Canvas">
          <div className="absolute inset-0 overflow-y-auto">
            {view === "code" ? (
              <CodeTab />
            ) : selected === HISTORY ? (
              <History />
            ) : module && props ? (
              // No key: switching between two blocks keeps the same 3D canvas (no new WebGL context).
              <module.Canvas {...props} />
            ) : (
              <Overview />
            )}
          </div>
        </section>
      </div>
    </ResizablePanel>
  )
  const handle = (id: string, show: boolean) => (
    <ResizableHandle key={id} disabled={!show} className={cn("w-px bg-transparent after:w-2 hover:bg-line focus-visible:bg-line", show ? "mx-1" : "mx-0 after:hidden")} />
  )

  // The inspector can swap sides; only then does the group remount.
  const left = inspectorSide === "left"
  return (
    <ResizablePanelGroup key={`${dir}-${inspectorSide}`} orientation="horizontal" id="project-editor" className="h-full min-h-0 pb-1">
      {left ? inspector : tree}
      {handle("h1", left ? showInspector : treeOpen)}
      {centre}
      {handle("h2", left ? treeOpen : showInspector)}
      {left ? tree : inspector}
    </ResizablePanelGroup>
  )
}
