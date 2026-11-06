// Small path helpers that work with both Windows (C:\...) and Unix (/...) paths.

const separator = (path: string) => (path.includes("\\") ? "\\" : "/")

export function joinPath(base: string, ...parts: string[]): string {
  const sep = separator(base)
  return [base.replace(/[\\/]+$/, ""), ...parts].join(sep)
}

/** "C:\Users\liam\Blocksy\my_mod" -> "my_mod" */
export const baseName = (path: string) => path.split(/[\\/]/).filter(Boolean).pop() ?? path

/** "C:\Users\liam\Blocksy" -> "C:\Users\liam" */
export const parentPath = (path: string) => path.replace(/[\\/]+[^\\/]+[\\/]*$/, "")

/** Shows the home folder as "~": "C:\Users\liam\Blocksy" -> "~/Blocksy". */
export function prettyPath(path: string, home: string | null): string {
  // Slashes may differ (a dropped folder can arrive as C:/Users/...): compare with one kind.
  const flat = (text: string) => text.replaceAll("\\", "/").toLowerCase()
  const rest = flat(path).slice(flat(home ?? "").length)
  if (!home || !flat(path).startsWith(flat(home)) || (rest !== "" && !rest.startsWith("/"))) return path
  return `~${path.slice(home.length).replaceAll("\\", "/")}`
}

/** The reverse of prettyPath: "~/Blocksy" -> "C:\Users\liam\Blocksy". */
export function expandHome(path: string, home: string | null): string {
  if (!home || !/^~([\\/]|$)/.test(path)) return path
  return joinPath(home, ...path.slice(1).split(/[\\/]/).filter(Boolean))
}

/** Same folder? Ignores which slash is used and the capitals (Windows paths). */
export const samePath = (a: string, b: string) => a.replaceAll("\\", "/").replace(/\/+$/, "").toLowerCase() === b.replaceAll("\\", "/").replace(/\/+$/, "").toLowerCase()
