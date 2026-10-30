// A project's cover picture: a small pixel-art block texture, like a Minecraft block
// face. It is generated from the project's folder path, so every project gets its own
// pattern and it never changes. Colours are mixed from theme tokens only (rule 9),
// so covers follow the theme. Real screenshots can replace this in a later release.
// Custom because shadcn has nothing like it. Small icons (sidebar, breadcrumb) pass a
// coarse grid like [4, 4]: same colour, bigger pixels, so it still reads at 14px.
//
//   ▓▒░▓▒▒▓░▓▒▓▓░▒▓▒
//   ▒▓▓░▒▓▒▒▓▓▒░▓▒▓▓   ← 16 × 10 pixels, each a lighter or darker shade of one colour
//   ...
const BASES = ["--b-project", "--b-brand", "--b-success", "--b-warning"]

/** A small, stable hash of a string (FNV-1a), so the same project always looks the same. */
function hash(text: string) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return h >>> 0
}

/** Pseudo-random numbers from a seed (mulberry32): same seed, same sequence. */
function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function ProjectCover({ seed, grid = [16, 10], className }: {
  /** Anything stable and unique per project; the folder path works well. */
  seed: string
  /** Pixels across and down. */
  grid?: [columns: number, rows: number]
  className?: string
}) {
  const [COLUMNS, ROWS] = grid
  const h = hash(seed)
  const next = random(h)
  const base = `var(${BASES[h % BASES.length]})`
  const cells = []
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLUMNS; x++) {
      // Mostly mid shades, with the odd light or dark speck, like a stone texture.
      const r = next()
      const mix = r < 0.12 ? `var(--b-fg) 22%` : r > 0.9 ? `var(--b-bg) 45%` : `var(--b-bg) ${Math.round(next() * 30)}%`
      cells.push(<rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={`color-mix(in oklch, ${base}, ${mix})`} />)
    }
  }
  return (
    <svg viewBox={`0 0 ${COLUMNS} ${ROWS}`} preserveAspectRatio="none" aria-hidden className={className} shapeRendering="crispEdges">
      {cells}
    </svg>
  )
}
