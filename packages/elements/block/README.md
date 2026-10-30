# @blocksy/element-block

The Block element: a full cube with hardness, blast resistance, tool, light, sound,
map colour, a 16x16 texture and a creative tab.

- `schema.ts` / `options.ts`: the data and the choices offered
- `inspector.tsx`: the editor panel (every field shows the Java it becomes)
- `canvas.tsx`: the live 3D preview (render on demand)
- `docs.ts`: data for the generated Docs reference page
- `png.ts`, `starter-texture.ts`: PNG checks and Blocksy's own starter art

Loader code is not here: the Fabric target has the adapter (`packages/targets/fabric/src/elements/block.ts`), see ADR 0006.
