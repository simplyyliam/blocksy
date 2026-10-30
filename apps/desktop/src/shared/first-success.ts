// Remembers which projects already had their "first time in game" moment.
const key = (dir: string) => `blocksy.celebrated.${dir}`

/** True once per project folder (remembered in this browser profile; best effort). */
export function firstSuccess(dir: string): boolean {
  try {
    if (localStorage.getItem(key(dir))) return false
    localStorage.setItem(key(dir), "1")
  } catch {
    // Storage blocked: celebrate anyway, it's harmless.
  }
  return true
}
