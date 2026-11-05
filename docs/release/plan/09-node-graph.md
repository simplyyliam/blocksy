# 9. The node graph: library choice

**Recommendation: [React Flow](https://reactflow.dev/) (`@xyflow/react`) behind a Blocksy adapter.**

| Library | Status | Fit for Blocksy |
| --- | --- | --- |
| [React Flow](https://reactflow.dev/) | MIT, v12 actively released (12.10.x changelog), shares a headless core with Svelte Flow; used by companies like Stripe | Best fit: React custom nodes, large community, steady maintenance |
| [Rete.js v2](https://retejs.org/docs/) | MIT, TypeScript-first, built-in dataflow and control-flow engines, aims at code generation | Strong alternative if Blocksy wants a built-in execution engine |
| [LiteGraph (Comfy fork)](https://github.com/JasonWeise/litegraph.js) | The standalone fork was archived and merged into ComfyUI's frontend in August 2025 | Avoid: no maintained standalone package |

Rules regardless of library:

- **Blocksy owns the graph model.** Nodes, pins, types and connections live in Blocksy's schema in `packages/core`. The library only draws and edits it, through an adapter.
- **Typed pins** (exec flow vs data; data types like Item, Block, Number, Text, Position) are validated by Blocksy, not the library.
- **Code generation walks Blocksy's model**, never the library's internal state.
- The canvas must meet its performance budget (section 4) with 300 and 1,000 nodes.
- Claude Code verifies current versions and maintenance at the start of v0.4 and records the decision in an ADR.
