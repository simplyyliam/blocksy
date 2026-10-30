// The smallest model document: one full cube with a texture per face.
// Previews are drawn from this plain data (plan rule 6), never from stored Three.js
// objects. Model Studio (v0.5) grows this into cubes, UVs and block states.

/** The six faces of a block, named the way Minecraft names them. */
export type Face = "up" | "down" | "north" | "south" | "east" | "west"

export interface CubeModel {
  /** PNG data URLs. `all` is used for any face that has no texture of its own. */
  textures: Partial<Record<Face | "all", string | null>>
}

/**
 * Minecraft lights faces by direction even without a light source: the top is
 * brightest, the bottom darkest, east/west a bit darker than north/south.
 * Using the same shades makes the preview look like the block in game.
 */
export const FACE_SHADE: Record<Face, number> = {
  up: 1,
  down: 0.5,
  north: 0.8,
  south: 0.8,
  east: 0.6,
  west: 0.6,
}

/** Three.js box faces come in this order: +x, -x, +y, -y, +z, -z. */
export const BOX_FACE_ORDER: Face[] = ["east", "west", "up", "down", "south", "north"]

/** The texture a face shows: its own, else the cube's `all` texture, else none. */
export function faceTexture(model: CubeModel, face: Face): string | null {
  return model.textures[face] ?? model.textures.all ?? null
}
