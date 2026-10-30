# @blocksy/bench

The performance harness. `pnpm bench` (from the repo root) measures the real app against the
budget in the release plan (section 4) and writes `docs/perf/<version>.md`.

- `scripts/run.mjs` builds a release binary if needed, launches it 5 times with
  `BLOCKSY_BENCH=<report file>`, samples memory of the whole process tree (blocksy.exe +
  WebView2), and writes the Markdown table. `BENCH_RUNS=3 pnpm bench` changes the run count.
- The app side lives in `apps/desktop/src/app/bench.ts` (timing + scripted workout) and
  `src-tauri/src/commands/bench.rs` (uptime, writing the report, quitting).
- Run it on the reference machine; Windows only for now.
