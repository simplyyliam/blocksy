// The pure parts of Clone (tested): is the address one we can clone, and what folder name does it suggest.
// The same rule is checked again in Rust (history.rs `clone_url_ok`), because the frontend is not the guard.

/** A message when the address can't be cloned, or null when it's fine. Only plain https addresses. */
export function validateCloneUrl(url: string): string | null {
  const text = url.trim()
  if (!/^https:\/\//i.test(text)) return "Use a web address that starts with https://"
  if (/\s/.test(text)) return "The address can't have spaces"
  try {
    const { hostname, pathname } = new URL(text)
    if (!hostname.includes(".")) return "That doesn't look like a repository address"
    if (pathname.replace(/\/+$/, "").split("/").filter(Boolean).length < 1) return "Add the repository name, like https://github.com/you/berry-mod"
  } catch {
    return "That doesn't look like a web address"
  }
  return null
}

/** "https://github.com/you/berry-mod.git" -> "berry-mod" (empty while the address isn't one yet). */
export function repoNameFromUrl(url: string): string {
  try {
    const last = new URL(url.trim()).pathname.replace(/\/+$/, "").split("/").filter(Boolean).pop() ?? ""
    return last.replace(/\.git$/i, "").replace(/[^A-Za-z0-9._-]/g, "_")
  } catch {
    return ""
  }
}
