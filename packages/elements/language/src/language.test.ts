import { describe, expect, it } from "vitest"
import { createProject, type ElementType } from "@blocksy/core"
import { languageDefaults, languageSchema, progress, projectKeys } from "./schema.ts"

const fakeItem = { id: "item", lang: (e: { id: string; name: string }, p: { modId: string }) => ({ [`item.${p.modId}.${e.id}`]: e.name }) } as unknown as ElementType

describe("language element", () => {
  it("defaults to an empty German table", () => {
    expect(languageSchema.parse(languageDefaults())).toEqual(languageDefaults())
  })

  it("collects every key the project makes, with its English text", () => {
    const project = {
      ...createProject({ name: "Berry Mod", target: "fabric", minecraftVersion: "26.1.2" }),
      elements: [{ id: "berry_bun", type: "item", name: "Berry Bun", data: {} }, { id: "x", type: "unknown", name: "X", data: {} }],
    }
    expect(projectKeys(project, [fakeItem])).toEqual({ "item.berry_mod.berry_bun": "Berry Bun" })
  })

  it("counts only filled translations", () => {
    expect(progress({ locale: "de_de", entries: { a: "A", b: " " } }, ["a", "b", "c"])).toEqual({ done: 1, total: 3 })
  })

  it("rejects bad codes and keys", () => {
    expect(languageSchema.safeParse({ locale: "German", entries: {} }).success).toBe(false)
    expect(languageSchema.safeParse({ locale: "de_de", entries: { "has space": "x" } }).success).toBe(false)
  })
})
