// Draws file paths as an indented tree, for "What gets created" in the New project dialog.
//   my_mod/
//     build.gradle
//     src/main/java/com/example/my_mod/
//       MyMod.java
// Folders with a single child folder are joined ("src/main/java/") to keep it short.

interface Folder {
  folders: Map<string, Folder>
  files: string[]
}

const emptyFolder = (): Folder => ({ folders: new Map(), files: [] })

export function fileTree(root: string, paths: string[], hide: (path: string) => boolean = () => false): string {
  const top = emptyFolder()
  for (const path of paths.filter((p) => !hide(p))) {
    const parts = path.split("/")
    const file = parts.pop()!
    let folder = top
    for (const part of parts) {
      if (!folder.folders.has(part)) folder.folders.set(part, emptyFolder())
      folder = folder.folders.get(part)!
    }
    folder.files.push(file)
  }

  const lines = [`${root}/`]
  const walk = (folder: Folder, depth: number) => {
    const pad = "  ".repeat(depth)
    for (const file of [...folder.files].sort()) lines.push(pad + file)
    for (const [name, child] of [...folder.folders].sort(([a], [b]) => a.localeCompare(b))) {
      // Join chains like src/ -> main/ -> java/ into one line.
      let label = `${name}/`
      let node = child
      while (node.files.length === 0 && node.folders.size === 1) {
        const [nextName, next] = [...node.folders][0]!
        label += `${nextName}/`
        node = next
      }
      lines.push(pad + label)
      walk(node, depth + 1)
    }
  }
  walk(top, 1)
  return lines.join("\n")
}
