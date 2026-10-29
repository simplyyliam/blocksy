// Slow Gradle tests only (`pnpm test:gradle`): real builds of generated mods.
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["packages/**/src/**/*.gradle-test.ts"],
    testTimeout: 30 * 60 * 1000, // first build downloads Gradle and Minecraft
  },
})
