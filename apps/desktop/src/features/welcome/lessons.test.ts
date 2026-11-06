// Keeps the Learn list (packages/docs/src/lessons.ts) equal to the lesson files in
// packages/docs/content/learn: same lessons, same order as meta.json, same title and description.
import { describe, expect, it } from "vitest"
import { LESSONS } from "@blocksy/docs"

const files = import.meta.glob("../../../../../packages/docs/content/learn/*.mdx", { query: "?raw", import: "default", eager: true }) as Record<string, string>
const meta = import.meta.glob("../../../../../packages/docs/content/learn/meta.json", { import: "default", eager: true }) as Record<string, { pages: string[] }>

const frontmatter = (text: string, key: string) => new RegExp(`^${key}:\\s*(.+)$`, "m").exec(text.split("---")[1] ?? "")?.[1]?.trim()

describe("Learn lessons", () => {
  const order = Object.values(meta)[0]!.pages
  it("lists every lesson file, in the order of meta.json", () => {
    expect(LESSONS.map((l) => l.slug)).toEqual(order)
  })
  it.each(LESSONS)("$slug has the title and description from its file", ({ slug, title, about }) => {
    const file = Object.entries(files).find(([path]) => path.endsWith(`/${slug}.mdx`))
    expect(file, `content/learn/${slug}.mdx exists`).toBeDefined()
    expect(frontmatter(file![1], "title")).toBe(title)
    expect(frontmatter(file![1], "description")).toBe(about)
  })
})
