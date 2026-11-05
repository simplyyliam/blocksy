# 8. Model Studio: Blocksy's own Blockbench-style editor

Model Studio is a boxy 3D model editor built into Blocksy with React Three Fiber, so models, textures and animations never leave the project. It ships in two stages: block and item models in v0.5, entity models and animation in v0.11.

### 8.1 How it is built

Every tool edits one **model document** (cubes, groups or bones with pivots, textures, UVs, animations, plus the format it targets). Exporters turn the document into game files. This is the same rule as the node graph: the document is the only source of truth.

| Part | How it works |
| --- | --- |
| Viewport | R3F scene; each cube is a box with its own UV per face. drei's transform gizmo moves, rotates and scales, snapped to Minecraft's pixel grid. Camera presets (front, side, top, GUI view). |
| Outliner | A tree of groups. In entity models a group is a **bone** with a pivot point, which animations rotate. |
| UV editor | A 2D canvas over the texture where each face's rectangle is dragged and resized; auto-UV and box-UV layouts. |
| Paint on the model | Clicking the model raycasts to the face and texture pixel under the cursor, then paints with the v0.3 texture editor's brushes. |
| Animator (v0.11) | A timeline with keyframes for each bone's rotation, position and scale, easing curves, looping, and live preview in the viewport. |
| Formats | Each format is a registered module with its own rules: block/item models only allow rotations in 22.5° steps on one axis and cubes inside the block space; entity models allow free rotation and bones. The editor warns as you break a rule. |
| Exporters | Block/item model JSON and blockstates; entity model code and animations; `.bbmodel` import and export so people can move between Blockbench and Blocksy. |

### 8.2 Licensing rule

Blockbench's source code is licensed under GPL-3.0, while models people make with it are their own ([Blockbench README](https://github.com/jannisx11/blockbench)). Blocksy must not copy Blockbench code. It can read and write the `.bbmodel` format and learn from how Blockbench behaves, with original code throughout.

### 8.3 Performance

Model Studio follows the React Three Fiber rules in section 4.2 and must hit its budget: 60 fps orbiting a 500-cube model at full 4K on the reference machine, no frames rendered when idle.
