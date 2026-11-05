# 4. Performance budget

Blocksy must feel fast on an ordinary laptop, not just a gaming PC. All targets are measured on the **reference machine**:

- **CPU:** AMD Ryzen 5 7430U (integrated Radeon graphics, no dedicated GPU)
- **Display:** 4K monitor at the display scaling Liam actually uses
- **Power:** plugged in, default power mode; also spot-check on battery

A 4K screen on integrated graphics is the hard case: a full-resolution 3D canvas pushes about four times the pixels of 1080p. Budgets are proposed starting points; v0.1 records a baseline and they can be tuned in an ADR, never silently.

| What | Target |
| --- | --- |
| Cold start to Home | 2.5 s or less |
| Open a 100-element project | 1 s or less |
| Typing, selecting, clicking anywhere | Visible response within 100 ms |
| Node canvas pan, zoom, drag | 60 fps with 300 nodes; 45 fps or better with 1,000 |
| Model Studio orbit and edit | 60 fps with a 500-cube model at full 4K; 45 fps or better with 2,000 cubes |
| GUI Studio drag at GUI scale 4 | 60 fps |
| Any 3D view when nothing changes | No frames rendered (idle GPU near zero) |
| Full regenerate of 100 elements | 2 s or less (Gradle build time excluded, but always shows progress) |
| Memory with a 100-element project | 600 MB or less |

### 4.1 How it is measured

- `packages/bench` holds fixed benchmark projects and scenes (a 300-node graph, a 500-cube and a 2,000-cube model, a busy GUI, a 100-element mod).
- A `bench` command opens each one in the real Tauri app, runs a scripted interaction, and records frame times (median and 95th percentile), startup time and memory.
- In development, show live stats with `r3f-perf` or `stats-gl` inside 3D views, and use the React Profiler and the webview's dev tools for the rest.
- Results go into `docs/perf/<release>.md` as a table. A regression of more than 10% against the previous release fails the definition of done until fixed or explained in an ADR.

### 4.2 React Three Fiber rules

1. **Render on demand.** Use `frameloop="demand"` and call `invalidate()` on change, so idle 3D views cost nothing.
2. **Cap and adapt pixel ratio.** At 4K, rendering at full device pixel ratio on integrated graphics is the main risk. Cap `dpr` (for example `[1, 1.5]`) and use drei's `PerformanceMonitor` to lower it while orbiting and restore it when still.
3. **Instance repeated geometry.** Cubes share one geometry and use `InstancedMesh` where possible; textures share an atlas with `NearestFilter`.
4. **No React state per frame.** Animate by mutating refs inside `useFrame`; read stores with selectors or transient subscriptions, so dragging a cube never re-renders the panels around it.
5. **Keep panels outside the Canvas.** Outliner, inspector and timelines are normal DOM; only the scene lives in R3F.
6. **Dispose what you create**, and keep post-processing off by default.
7. **Move heavy work off the main thread:** exporting, UV packing and project indexing run in Web Workers.
8. Match the R3F major version to the React version (verify in the v0.1 ADR).
