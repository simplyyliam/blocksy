// The "What's new" banner: a little pixel-art world with a block floating in the middle.
// Custom (shadcn has nothing like it). Everything is generated from the version number,
// so each release gets its own scene and its own block, and it never changes for a release.
// Colours are theme tokens mixed together (rule 9), so it fits Modern and Minecraft alike.
//
//      ░ ▒  cloud            ▒░
//              ┌──◇──┐
//              │ ▓▒▓ │   <- an isometric pixel block (ore, planks, gem or grass)
//              └──◇──┘
//   ▂▃▅▆▅▃▂▃▅▇▆▅▃▂▂▃▅▆▅▃   <- stepped pixel hills
const TOKENS = ["--b-brand", "--b-success", "--b-warning", "--b-project", "--b-danger"]
const STYLES = ["gem", "ore", "planks", "grass"] as const

/** FNV-1a: a stable number from a string. */
function hash(text: string) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return h >>> 0
}

/** mulberry32: the same seed always gives the same numbers. */
function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const mix = (a: string, b: string, pct: number) => `color-mix(in oklch, var(${a}), var(${b}) ${pct}%)`

/** One 8x8 face texture as colours, by block style. `shade` darkens (+) or lightens (-) it. */
function face(style: (typeof STYLES)[number], base: string, accent: string, next: () => number, top: boolean): string[] {
  const px: string[] = []
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const r = next()
      let c = mix(base, "--b-bg", Math.round(r * 22))
      if (style === "gem" && (x === 0 || y === 0)) c = mix(base, "--b-bg", 55)
      if (style === "gem" && (x === 7 || y === 7)) c = mix(base, "--b-fg", 30)
      if (style === "ore" && r > 0.82) c = mix(accent, "--b-bg", 20)
      if (style === "planks" && y % 3 === 2) c = mix(base, "--b-fg", 28)
      if (style === "grass" && (top || y < 2 + (x % 3 === 0 ? 1 : 0))) c = mix("--b-success", "--b-bg", Math.round(r * 25))
      px.push(c)
    }
  }
  return px
}

/** An 8x8 texture painted onto a parallelogram (origin o, edges u and v): one cube face. */
function Face({ pixels, o, u, v, shade }: { pixels: string[]; o: [number, number]; u: [number, number]; v: [number, number]; shade: string | null }) {
  return (
    <g transform={`matrix(${u[0] / 8} ${u[1] / 8} ${v[0] / 8} ${v[1] / 8} ${o[0]} ${o[1]})`}>
      {pixels.map((fill, i) => (
        <rect key={i} x={i % 8} y={Math.floor(i / 8)} width={1.04} height={1.04} fill={fill} />
      ))}
      {shade && <rect width={8} height={8} fill={shade} />}
    </g>
  )
}

export function ReleaseArt({ version }: { version: string }) {
  const h = hash(`blocksy-${version}`)
  const next = random(h)
  const base = TOKENS[h % (TOKENS.length - 1)]! // never red as the main colour
  const accent = TOKENS[(h >>> 3) % TOKENS.length]!
  const style = STYLES[(h >>> 7) % STYLES.length]!

  // Hills: two stepped rows of pixel columns across the bottom, back (faint) and front.
  const columns = 40
  const hill = (lift: number, rough: number) => {
    let height = lift
    return Array.from({ length: columns }, () => (height = Math.max(lift - 3, Math.min(lift + 4, height + Math.round((next() - 0.5) * rough)))))
  }
  const back = hill(5, 2)
  const front = hill(3, 2)
  const clouds = Array.from({ length: 3 }, () => ({ x: Math.round(next() * 34) + 2, y: Math.round(next() * 3) + 2, w: 3 + Math.round(next() * 4) }))

  return (
    <div className="relative h-[200px] overflow-hidden">
      {/* Sky: brand blue fading into the page colour. */}
      <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${mix("--b-brand", "--b-bg", 35)}, ${mix("--b-brand", "--b-bg", 78)} 70%)` }} />
      <svg aria-hidden viewBox={`0 0 ${columns} 15`} preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" shapeRendering="crispEdges">
        {clouds.map((c, i) => (
          <g key={i} fill={mix("--b-bg", "--b-brand", 8)} opacity={0.85}>
            <rect x={c.x} y={c.y} width={c.w} height={1} />
            <rect x={c.x + 1} y={c.y - 1} width={c.w - 2} height={1} />
          </g>
        ))}
        {back.map((height, x) => (
          <rect key={`b${x}`} x={x} y={15 - height} width={1.02} height={height} fill={mix("--b-success", "--b-bg", 45)} />
        ))}
        {front.map((height, x) => (
          <g key={`f${x}`}>
            <rect x={x} y={15 - height} width={1.02} height={height} fill={mix("--b-success", "--b-fg", 18)} />
            <rect x={x} y={15 - height} width={1.02} height={1} fill={mix("--b-success", "--b-bg", 25)} />
          </g>
        ))}
      </svg>

      {/* The release's block, floating gently (still when the OS asks for reduced motion). */}
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative size-[136px] motion-safe:animate-[whats-new-float_4s_ease-in-out_infinite]">
          <span aria-hidden className="absolute -bottom-3 left-1/2 h-2 w-16 -translate-x-1/2 rounded-full bg-black/15 blur-[3px]" />
          <svg viewBox="0 0 100 100" aria-hidden className="size-full drop-shadow-md" shapeRendering="crispEdges">
            <Face pixels={face(style, base, accent, next, true)} o={[20, 32]} u={[30, -15]} v={[30, 15]} shade={null} />
            <Face pixels={face(style, base, accent, next, false)} o={[20, 32]} u={[30, 15]} v={[0, 36]} shade="color-mix(in oklch, var(--b-black) 12%, transparent)" />
            <Face pixels={face(style, base, accent, next, false)} o={[50, 47]} u={[30, -15]} v={[0, 36]} shade="color-mix(in oklch, var(--b-black) 26%, transparent)" />
            {/* A dark outline and edges, so the block stands out from any sky or hill. */}
            <g fill="none" stroke={mix(base, "--b-black", 55)} strokeWidth={1.4} strokeLinejoin="round">
              <polygon points="20,32 50,17 80,32 80,68 50,83 20,68" />
              <polyline points="20,32 50,47 80,32" />
              <line x1={50} y1={47} x2={50} y2={83} />
            </g>
          </svg>
          {/* A few sparkles around it. */}
          {[[-8, 22], [128, 36], [118, 108]].map(([x, y], i) => (
            <span
              key={i}
              aria-hidden
              className="absolute size-1.5 bg-white/80 motion-safe:animate-[whats-new-twinkle_2.4s_ease-in-out_infinite]"
              style={{ left: x, top: y, animationDelay: `${i * 0.7}s` }}
            />
          ))}
        </div>
      </div>
      <span className="absolute top-3 left-4 rounded-md bg-black/20 px-1.5 py-0.5 font-mono text-[11px] text-white backdrop-blur-sm">v{version}</span>
    </div>
  )
}
