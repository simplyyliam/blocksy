// One Vitest setup for the whole repo: `pnpm test` finds every *.test.ts(x)
// file in apps/ and packages/ and runs them together.
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["{apps,packages}/**/src/**/*.test.{ts,tsx}"],
  },
})
