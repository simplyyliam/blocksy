// Every built-in command, registered once. The menu bar (menus.ts), toolbar, palette and
// shortcuts only point at these ids. A new action = one `defineCommand` here.
import {
  BookOpen, Box, Code2, Coffee, Copy, Download, FileAudio, FolderOpen, History, Hammer, ImageIcon, Keyboard, LayoutDashboard,
  Layers, Library, PanelBottom, Pin, PanelLeft, PanelRight, Plus, Play, Redo2, RotateCcw, Save, Search, Settings, Shapes, Sparkles, Square,
  SquareTerminal, Trash2, Undo2, X, ArrowLeftRight,
} from "lucide-react"
import { getCurrentWindow } from "@tauri-apps/api/window"
import { revealItemInDir } from "@tauri-apps/plugin-opener"
import { deleteElement, duplicateElement, selectedElement } from "../element-actions"
import { buildMod, exportMod, runMod, stopTask } from "../project-actions"
import { importResource, importTexture } from "../import-resources"
import { changeCover, closeProject } from "../project-menu-actions"
import { DOCS, HISTORY, LIBRARY, OVERVIEW, useEditor, type DockTab } from "../stores/editor"
import { useGradle } from "../stores/gradle"
import { useNavigation } from "../stores/navigation"
import { useProject } from "../stores/project"
import { defineCommand } from "./registry"

const editor = () => useEditor.getState()
const nav = () => useNavigation.getState()
const project = () => useProject.getState().current
const idle = () => useGradle.getState().task === null

/** True while the bottom dock is open on this tab. */
const dockShows = (tab: DockTab) => nav().bottomPanelOpen && editor().dockTab === tab
/** The activity bar's dock buttons: open the tab, or close the dock if it is already showing it. */
const toggleDock = (tab: DockTab) => {
  if (dockShows(tab)) return nav().setBottomPanel(false)
  editor().setDockTab(tab)
  nav().setBottomPanel(true)
}

let registered = false

/** Registers the commands once (the app calls this at start-up). */
export function registerBuiltinCommands() {
  if (registered) return
  registered = true

  // ---- File -------------------------------------------------------------------------------
  defineCommand({ id: "file.new-element", group: "File", title: "New element…", icon: Plus, keys: "N", run: () => editor().openNewElement(), keywords: ["add", "create", "block", "item"] })
  defineCommand({
    id: "file.save",
    group: "File",
    title: "Save version…",
    icon: Save,
    keys: "Mod+S",
    keywords: ["commit", "history", "git"],
    run: () => {
      // Inspector fields commit on blur: blur first, so a half-typed edit is saved, not lost.
      if (document.activeElement instanceof HTMLElement && document.activeElement.id !== "history-message") document.activeElement.blur()
      // v0.4: saved versions live in the bottom dock (History tab), with the message box focused.
      editor().setDockTab("history")
      nav().setBottomPanel(true)
      setTimeout(() => document.getElementById("history-message")?.focus(), 250)
    },
  })
  defineCommand({ id: "file.reveal", group: "File", title: "Show in folder", icon: FolderOpen, run: () => void revealItemInDir(project()!.dir) })
  defineCommand({ id: "file.close", group: "File", title: "Close project", icon: X, keys: "Mod+Shift+W", run: closeProject })
  defineCommand({ id: "file.settings", group: "File", title: "Settings…", icon: Settings, keys: "Mod+,", needsProject: false, run: () => nav().setSettings(true) })
  defineCommand({ id: "file.exit", group: "File", title: "Exit", needsProject: false, run: () => void getCurrentWindow().close() })

  // ---- Edit -------------------------------------------------------------------------------
  defineCommand({
    id: "edit.undo",
    group: "Edit",
    title: "Undo",
    icon: Undo2,
    keys: "Mod+Z",
    skipWhileTyping: true,
    enabled: () => project()?.documents.canUndo() ?? false,
    run: () => project()?.documents.undo(),
  })
  defineCommand({
    id: "edit.redo",
    group: "Edit",
    title: "Redo",
    icon: Redo2,
    keys: "Mod+Shift+Z",
    altKeys: ["Mod+Y"],
    skipWhileTyping: true,
    enabled: () => project()?.documents.canRedo() ?? false,
    run: () => project()?.documents.redo(),
  })
  defineCommand({ id: "edit.duplicate", group: "Edit", title: "Duplicate element", icon: Copy, keys: "Mod+D", enabled: () => selectedElement() !== undefined, run: () => { const e = selectedElement(); if (e) duplicateElement(e) } })
  defineCommand({ id: "edit.delete", group: "Edit", title: "Delete element", icon: Trash2, keys: "Delete", enabled: () => selectedElement() !== undefined, run: () => { const e = selectedElement(); if (e) deleteElement(e) } })

  // ---- Project ----------------------------------------------------------------------------
  // The activity bar's views open as centre tabs, so the project never unmounts (ADR 0019).
  const openView = (id: string) => { editor().setView("design"); editor().select(id) }
  defineCommand({ id: "project.overview", group: "Project", title: "Overview", icon: LayoutDashboard, keys: "Mod+Shift+O", checked: () => editor().selected === OVERVIEW, run: () => openView(OVERVIEW) })
  defineCommand({ id: "project.library", group: "Project", title: "Library", icon: Library, keys: "Mod+Shift+L", checked: () => editor().selected === LIBRARY, run: () => openView(LIBRARY), keywords: ["vanilla", "blocks", "items", "ids", "minecraft"] })
  defineCommand({ id: "project.history", group: "Project", title: "History", icon: History, keys: "Mod+Shift+H", checked: () => editor().selected === HISTORY, run: () => openView(HISTORY), keywords: ["versions", "git"] })
  defineCommand({ id: "project.design", group: "Project", title: "Design view", icon: Shapes, keys: "Mod+1", checked: () => editor().view === "design", run: () => editor().setView("design") })
  defineCommand({ id: "project.code", group: "Project", title: "Code view", icon: Code2, keys: "Mod+2", checked: () => editor().view === "code", run: () => editor().setView("code"), keywords: ["java", "generated"] })
  defineCommand({ id: "project.cover", group: "Project", title: "Change cover…", icon: ImageIcon, run: () => void changeCover(project()!.dir) })

  // ---- Resources: typed imports -------------------------------------------------------------
  defineCommand({ id: "resources.block-texture", group: "Resources", title: "Import block texture…", icon: Box, keywords: ["png", "picture"], run: () => importTexture("block") })
  defineCommand({ id: "resources.item-texture", group: "Resources", title: "Import item texture…", icon: Layers, keywords: ["png", "picture", "animation"], run: () => importTexture("item") })
  // Files that land in the project's resources (written into the mod on Build); undo removes them.
  defineCommand({ id: "resources.gui-texture", group: "Resources", title: "Import GUI texture…", icon: ImageIcon, keywords: ["png", "screen", "menu"], run: () => importResource("gui-texture") })
  defineCommand({ id: "resources.particle-texture", group: "Resources", title: "Import particle texture…", icon: Sparkles, keywords: ["png", "effect"], run: () => importResource("particle-texture") })
  defineCommand({ id: "resources.sound", group: "Resources", title: "Import sound…", icon: FileAudio, keywords: ["ogg", "audio", "music"], run: () => importResource("sound") })
  defineCommand({ id: "resources.model", group: "Resources", title: "Import model…", icon: Shapes, keywords: ["blockbench", "bbmodel", "json", "3d"], run: () => importResource("model") })

  // ---- Build & run ------------------------------------------------------------------------
  defineCommand({ id: "build.build", group: "Build & run", title: "Build", icon: Hammer, keys: "Mod+B", enabled: idle, run: () => void buildMod(), keywords: ["compile"] })
  defineCommand({ id: "build.run", group: "Build & run", title: "Run in Minecraft", icon: Play, keys: "F5", enabled: idle, run: () => void runMod(), keywords: ["play", "game"] })
  defineCommand({ id: "build.export", group: "Build & run", title: "Export .jar", icon: Download, keys: "Mod+E", enabled: idle, run: () => void exportMod() })
  defineCommand({ id: "build.stop", group: "Build & run", title: "Stop", icon: Square, enabled: () => !idle(), run: stopTask })
  defineCommand({ id: "build.log", group: "Build & run", title: "Show build log", icon: SquareTerminal, keys: "Mod+Shift+U", checked: () => dockShows("log"), run: () => toggleDock("log") })

  // ---- Tools ------------------------------------------------------------------------------
  defineCommand({ id: "tools.palette", group: "Tools", title: "Search…", icon: Search, keys: "Mod+K", altKeys: ["Mod+Shift+F"], needsProject: false, run: () => nav().setPalette(true) })
  defineCommand({ id: "tools.problems", group: "Tools", title: "Show problems", icon: Layers, keys: "Mod+Shift+M", checked: () => dockShows("problems"), run: () => toggleDock("problems") })
  defineCommand({ id: "tools.jdk", group: "Tools", title: "Java setup", icon: Coffee, needsProject: false, run: () => nav().go("jdk") })

  // ---- Window -----------------------------------------------------------------------------
  defineCommand({ id: "window.tree", group: "Window", title: "Explorer", icon: PanelLeft, keys: "Mod+\\", checked: () => editor().treeOpen, run: () => editor().toggleTree() })
  defineCommand({ id: "window.inspector", group: "Window", title: "Inspector", icon: PanelRight, keys: "Mod+Alt+I", checked: () => editor().inspectorOpen, run: () => editor().toggleInspector() })
  defineCommand({ id: "window.dock", group: "Window", title: "Bottom dock", icon: PanelBottom, keys: "Mod+J", checked: () => nav().bottomPanelOpen, run: () => nav().setBottomPanel(!nav().bottomPanelOpen) })
  defineCommand({ id: "window.swap", group: "Window", title: "Swap inspector side", icon: ArrowLeftRight, run: () => editor().swapInspectorSide() })
  defineCommand({ id: "window.reset", group: "Window", title: "Reset layout", icon: RotateCcw, run: () => { editor().resetLayout(); nav().setBottomPanel(false) } })
  defineCommand({ id: "tab.close", group: "Window", title: "Close tab", icon: X, keys: "Mod+W", run: () => editor().closeTab(editor().selected) })
  defineCommand({ id: "tab.pin", group: "Window", title: "Pin tab", icon: Pin, checked: () => editor().pinned.includes(editor().selected), run: () => { const id = editor().selected; if (editor().pinned.includes(id)) editor().unpin(id); else editor().pin(id) } })
  defineCommand({ id: "tab.next", group: "Window", title: "Next tab", keys: "Mod+PageDown", run: () => editor().cycleTab(1) })
  defineCommand({ id: "tab.previous", group: "Window", title: "Previous tab", keys: "Mod+PageUp", run: () => editor().cycleTab(-1) })

  // ---- Help -------------------------------------------------------------------------------
  // Inside a project the docs open as a tab (the project stays put); elsewhere they are a page.
  defineCommand({ id: "help.docs", group: "Help", title: "Documentation", icon: BookOpen, keys: "F1", needsProject: false, checked: () => project() !== null && editor().selected === DOCS, run: () => (project() ? openView(DOCS) : nav().openDocs("/docs")) })
  defineCommand({ id: "help.shortcuts", group: "Help", title: "Keyboard shortcuts", icon: Keyboard, keys: "?", needsProject: false, run: () => nav().setShortcuts(true) })
  defineCommand({ id: "help.whats-new", group: "Help", title: "What's new", icon: Sparkles, needsProject: false, run: () => nav().setWhatsNew(true) })
}
