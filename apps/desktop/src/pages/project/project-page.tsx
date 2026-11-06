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
import { useEffect, useState } from "react"
import { renameElement, updateElement, type Element } from "@blocksy/core"
import { cn, InspectorTabs, ResizableHandle, ResizablePanel, ResizablePanelGroup, usePanelRef } from "@blocksy/ui"
import { FirstBuild } from "../../features/first-build/first-build"
import { CodeTab } from "../../features/project-editor/code-tab"
import { InspectorCode } from "../../features/project-editor/inspector-code"
import { FileDrop } from "../../features/project-editor/file-drop"
import { BottomPanel } from "../../widgets/bottom-panel/bottom-panel"
import { DocsView } from "../../features/project-editor/docs-view"
import { History } from "../../features/project-editor/history"
import { Library } from "../../features/project-editor/library"
import { Overview } from "../../features/project-editor/overview"
import { ProjectTree } from "../../features/project-editor/project-tree"
import { EditorToolbar } from "../../features/project-editor/editor-toolbar"
import { TabStrip } from "../../features/project-editor/tab-strip"
import { elementModules, registries } from "../../app/modules"
import { useLayoutMemory } from "../../shared/layout-memory"
import { DOCS, HISTORY, LIBRARY, useEditor } from "../../shared/stores/editor"
import { playMinecraftSound } from "../../shared/minecraft-sounds"
import { useGradle } from "../../shared/stores/gradle"
import { useWorkspace } from "../../shared/vanilla/workspace"
import { useProject, type OpenProject } from "../../shared/stores/project"

/** The props every element canvas and inspector receives (core's ElementEditorProps). */
function editorProps(project: OpenProject, element: Element, select: (id: string) => void, mode: string | undefined) {
  return {
    mode,
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
  // The setup screen only blocks the editor while Minecraft's look is not available yet
  // and the user has not chosen "Open editor now".
  const setupHidden = useWorkspace((s) => s.setupHidden)
  const lookReady = useWorkspace((s) => s.status === "ready")
  const { selected, view, treeOpen, inspectorOpen, inspectorSide, treeWidth, inspectorWidth, select } = useEditor()
  const setLayout = useEditor((s) => s.setLayout)
  const layoutVersion = useEditor((s) => s.layoutVersion)
  const modeByType = useEditor((s) => s.modeByType)

  // A freshly opened project starts on its Overview tab, with its remembered panel layout.
  const dir = project?.dir
  useEffect(() => {
    useEditor.getState().resetTabs()
  }, [dir])
  const layoutReady = useLayoutMemory(dir)

  // The starting widths are read once per panel group. If `defaultSize` followed the live widths,
  // every drag would change the props, the panels would re-register and fight the drag
  // (sizes crept upward and resizing felt stuck). Resizing only writes to the store.
  const groupKey = `${dir}-${inspectorSide}-${layoutVersion}`
  const [start, setStart] = useState({ key: "", tree: 0, inspector: 0 })
  if (layoutReady && start.key !== groupKey) {
    setStart({ key: groupKey, tree: treeOpen ? treeWidth : 0, inspector: inspectorOpen && view === "design" ? inspectorWidth : 0 })
  }

  // Menu and keyboard toggles (editor store) collapse or expand the panels.
  const treeRef = usePanelRef()
  const inspectorRef = usePanelRef()
  const showInspectorNow = inspectorOpen && view === "design"
  useEffect(() => {
    const panel = treeRef.current
    if (!panel) return
    if (treeOpen && panel.isCollapsed()) {
      const width = useEditor.getState().treeWidth // read first: expanding reports the minimum width
      panel.expand()
      panel.resize(width)
    }
    else if (!treeOpen && !panel.isCollapsed()) panel.collapse()
  }, [treeOpen, layoutReady, treeRef])
  useEffect(() => {
    const panel = inspectorRef.current
    if (!panel) return
    if (showInspectorNow && panel.isCollapsed()) {
      const width = useEditor.getState().inspectorWidth
      panel.expand()
      panel.resize(width)
    }
    else if (!showInspectorNow && !panel.isCollapsed()) panel.collapse()
  }, [showInspectorNow, layoutReady, inspectorRef])

  // Elements can vanish (delete, undo of a create): close their tabs.
  const doc = project?.doc
  useEffect(() => {
    if (doc) useEditor.getState().pruneTabs(new Set(doc.elements.map((e) => e.id)))
  }, [doc])

  if (!project) return null
  if (firstBuild && !setupHidden && !lookReady) return <FirstBuild />
  if (!layoutReady) return null // a few milliseconds: the saved panel sizes are being read

  const element = project.doc.elements.find((e) => e.id === selected)
  const module = element && elementModules.get(element.type)
  const modes = module?.modes
  const mode = element && modes ? (modeByType[element.type] ?? modes[0]!.id) : undefined
  const props = element && editorProps(project, element, select, mode)
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
      defaultSize={start.tree}
      minSize={200}
      maxSize={440}
      groupResizeBehavior="preserve-pixel-size"
      onResize={(size) => (size.inPixels === 0 ? useEditor.getState().treeOpen && setLayout({ treeOpen: false }) : setLayout({ treeOpen: true, treeWidth: Math.round(size.inPixels) }))}
    >
      <div className="h-full overflow-hidden rounded-lg bg-surface">
        <ProjectTree />
      </div>
    </ResizablePanel>
  )
  const inspector = (
    <ResizablePanel
      id="inspector"
      key="inspector"
      panelRef={inspectorRef}
      collapsible
      collapsedSize={0}
      defaultSize={start.inspector}
      minSize={240}
      maxSize={520}
      groupResizeBehavior="preserve-pixel-size"
      onResize={(size) => (size.inPixels === 0 ? useEditor.getState().inspectorOpen && useEditor.getState().view === "design" && setLayout({ inspectorOpen: false }) : setLayout({ inspectorOpen: true, inspectorWidth: Math.round(size.inPixels) }))}
    >
      {/* A tool panel: a slightly tinted background so the canvas stays the focus. */}
      <aside
        aria-label="Inspector"
        className="h-full overflow-x-hidden overflow-y-auto rounded-lg bg-surface [&_[data-slot=input]]:h-6.5 [&_[data-slot=select-trigger]]:h-6.5 [&_[data-slot=textarea]]:min-h-14 [&_[data-slot=checkbox]]:border-fg-faint [&_[data-slot=checkbox]]:bg-bg"
      >
        {module && props ? (
          <InspectorTabs
            key={element.id}
            tabs={module.inspectorTabs ?? [{ id: "properties", label: "Properties" }]}
            codePanel={<InspectorCode element={element} />}
          >
            <module.Inspector {...props} />
          </InspectorTabs>
        ) : (
          <p className="px-4 py-3 text-sm text-fg-faint">Open an element to edit its properties here.</p>
        )}
      </aside>
    </ResizablePanel>
  )
  const centre = (
    <ResizablePanel id="centre" key="centre" minSize={320}>
      <div className="flex h-full min-h-0 flex-col gap-(--b-panel-gap)">
        {/* One floating card: tabs, toolbar and the canvas. The bottom dock is a second card under it. */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-surface">
        <TabStrip />
        <EditorToolbar />
        {/* The canvas: the work fills it; element tools float on it. */}
        <section className="relative min-h-0 flex-1 overflow-hidden" aria-label="Canvas">
          <div className="absolute inset-0 overflow-y-auto">
            {view === "code" ? (
              <CodeTab />
            ) : selected === HISTORY ? (
              <History />
            ) : selected === LIBRARY ? (
              <Library />
            ) : selected === DOCS ? (
              <DocsView />
            ) : module && props ? (
              // No key: switching between two blocks keeps the same 3D canvas (no new WebGL context).
              <module.Canvas {...props} />
            ) : (
              <Overview />
            )}
          </div>
        </section>
        </div>
        <BottomPanel />
      </div>
    </ResizablePanel>
  )
  const handle = (id: string, show: boolean) => (
    <ResizableHandle key={id} disabled={!show} className={cn("bg-transparent after:w-2 hover:bg-line focus-visible:bg-line", show ? "w-(--b-panel-gap)" : "w-0 after:hidden")} />
  )

  // The inspector can swap sides; only then does the group remount.
  const left = inspectorSide === "left"
  return (
    <>
      <ResizablePanelGroup key={groupKey} orientation="horizontal" id="project-editor" className="h-full min-h-0">
        {left ? inspector : tree}
        {handle("h1", left ? showInspector : treeOpen)}
        {centre}
        {handle("h2", left ? treeOpen : showInspector)}
        {left ? tree : inspector}
      </ResizablePanelGroup>
      <FileDrop />
    </>
  )
}
