// A dummy element type: the whole module lives in this one folder.
// It proves the plan's promise: a new element type = one folder + one registration line.
// Real element types live in packages/elements/<name> with exactly this shape.
import type { ElementType } from "@blocksy/core"
import { z } from "zod"

const schema = z.object({ greeting: z.string().min(1) })

export const dummyElement: ElementType<z.infer<typeof schema>> = {
  id: "dummy",
  name: "Dummy",
  schema,
  defaults: () => ({ greeting: "Hello" }),
  templates: {
    // One small template per target: writes a JSON file into the mod's assets.
    fabric: (element, ctx) => [
      { path: `${ctx.paths.assets}/dummy/${element.id}.json`, contents: `${JSON.stringify(element.data)}\n` },
    ],
  },
}
