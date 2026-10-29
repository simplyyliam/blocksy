// Trivial test so `pnpm test` has something to run. Real tests arrive in v0.1.
import { describe, expect, it } from "vitest"
import { PACKAGE_NAME } from "./index.ts"

describe("@blocksy/core", () => {
  it("exports its package name", () => {
    expect(PACKAGE_NAME).toBe("@blocksy/core")
  })
})
