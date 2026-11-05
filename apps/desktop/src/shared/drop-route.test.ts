import { describe, expect, it } from "vitest"
import { routeDroppedFile } from "./drop-route"

describe("files dropped from the desktop", () => {
  it("routes sounds and models by extension", () => {
    expect(routeDroppedFile("pop.OGG", undefined)).toEqual({ to: "resource", kind: "sound" })
    expect(routeDroppedFile("lamp.bbmodel", "block")).toEqual({ to: "resource", kind: "model" })
    expect(routeDroppedFile("lamp.json", undefined)).toEqual({ to: "resource", kind: "model" })
  })
  it("routes pictures by name, then by the selected element", () => {
    expect(routeDroppedFile("spark_particle.png", "block")).toEqual({ to: "resource", kind: "particle-texture" })
    expect(routeDroppedFile("furnace_gui.png", "item")).toEqual({ to: "resource", kind: "gui-texture" })
    expect(routeDroppedFile("ruby.png", "item")).toEqual({ to: "texture", type: "item" })
    expect(routeDroppedFile("ruby.png", "block")).toEqual({ to: "texture", type: "block" })
    expect(routeDroppedFile("ruby.png", "recipe")).toEqual({ to: "resource", kind: "gui-texture" })
    expect(routeDroppedFile("ruby.png", undefined)).toEqual({ to: "resource", kind: "gui-texture" })
  })
  it("ignores other files", () => {
    expect(routeDroppedFile("notes.txt", undefined)).toBeNull()
    expect(routeDroppedFile("song.mp3", undefined)).toBeNull()
  })
})
