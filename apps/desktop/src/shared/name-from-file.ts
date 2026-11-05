/** A name for an element made from a file: "berry_dough.png" -> "Berry Dough". */
export function nameFromFile(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim()
  return base ? base.replace(/\b[a-z]/g, (c) => c.toUpperCase()) : "Imported"
}
