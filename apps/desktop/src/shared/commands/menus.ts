// The menu bar's structure: which commands sit in which menu, in which order.
// "-" is a separator. Titles, icons and shortcuts come from the command itself (builtin.ts).
export interface MenuDef {
  title: string
  items: string[]
}

export const menus: MenuDef[] = [
  { title: "File", items: ["file.new-element", "-", "file.save", "file.reveal", "-", "file.settings", "file.close", "file.exit"] },
  { title: "Edit", items: ["edit.undo", "edit.redo", "-", "edit.duplicate", "edit.delete"] },
  { title: "Project", items: ["project.overview", "project.history", "-", "project.design", "project.code", "-", "project.cover"] },
  {
    title: "Resources",
    items: ["resources.block-texture", "resources.item-texture", "resources.gui-texture", "resources.particle-texture", "-", "resources.sound", "resources.model"],
  },
  { title: "Build & run", items: ["build.build", "build.run", "build.export", "-", "build.stop", "build.log"] },
  { title: "Tools", items: ["tools.palette", "tools.problems", "-", "tools.jdk"] },
  {
    title: "Window",
    items: ["window.tree", "window.inspector", "window.dock", "-", "window.swap", "window.reset", "-", "tab.close", "tab.pin", "tab.next", "tab.previous"],
  },
  { title: "Help", items: ["help.docs", "help.shortcuts", "help.whats-new"] },
]
