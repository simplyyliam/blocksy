// Keyboard shortcuts as plain text, e.g. "Mod+Shift+Z" or "N" or "?".
// Pure functions (no DOM state), so they are easy to test.
//   Mod   = Ctrl on Windows and Linux, Cmd on macOS
//   Alt, Shift = as named; the last part is the key itself

export interface KeyLike {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  altKey: boolean
}

interface Parsed {
  mod: boolean
  shift: boolean
  alt: boolean
  key: string
}

export function parseShortcut(text: string): Parsed {
  const parts = text.split("+")
  // "Mod++" is not used; a lone "+" key is written "Plus".
  const raw = parts[parts.length - 1]!
  const flags = new Set(parts.slice(0, -1).map((p) => p.toLowerCase()))
  return {
    mod: flags.has("mod"),
    shift: flags.has("shift"),
    alt: flags.has("alt"),
    key: raw === "Plus" ? "+" : raw.toLowerCase(),
  }
}

/** True when the key event is exactly this shortcut (no extra modifiers). */
export function matchesShortcut(event: KeyLike, text: string): boolean {
  const s = parseShortcut(text)
  const mod = event.ctrlKey || event.metaKey
  if (mod !== s.mod || event.altKey !== s.alt) return false
  const key = event.key.toLowerCase()
  // Symbols such as "?" already include Shift in the key itself, so only letters check it.
  const isLetter = key.length === 1 && key >= "a" && key <= "z"
  if (isLetter || s.shift) {
    if (event.shiftKey !== s.shift) return false
  }
  return key === s.key
}

/** Shows a shortcut for people: "Mod+Shift+Z" -> ["Ctrl", "Shift", "Z"]. */
export function shortcutParts(text: string, mac = false): string[] {
  return text.split("+").map((part) => {
    const p = part.toLowerCase()
    if (p === "mod") return mac ? "⌘" : "Ctrl"
    if (p === "plus") return "+"
    return part.length === 1 ? part.toUpperCase() : part
  })
}

/** True for shortcuts that carry no Ctrl/Alt: they must not fire while you type. */
export function isBareShortcut(text: string): boolean {
  const s = parseShortcut(text)
  return !s.mod && !s.alt
}
