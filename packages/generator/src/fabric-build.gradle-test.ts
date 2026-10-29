// Slow test: generates an empty mod for every pinned Fabric version and runs a real
// `gradlew build` on it. This is what "pinned and tested versions" means.
// Run with: pnpm test:gradle   (needs a JDK and internet; first run takes minutes)
import { execFileSync } from "node:child_process"
import { mkdirSync, mkdtempSync, writeFileSync, chmodSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { describe, expect, it } from "vitest"
import { createProject, createRegistries } from "@blocksy/core"
import { FABRIC_VERSIONS, fabricTarget } from "@blocksy/target-fabric"
import { generate } from "./index.ts"

const registries = createRegistries()
registries.loaderTargets.register(fabricTarget)

describe.each(FABRIC_VERSIONS)("Fabric $minecraft", ({ minecraft }) => {
  it("builds a jar from the generated empty mod", () => {
    const project = createProject({ name: "Gradle Check", target: "fabric", minecraftVersion: minecraft })
    const dir = mkdtempSync(join(tmpdir(), `blocksy-${minecraft}-`))

    for (const file of generate(project, registries)) {
      const path = join(dir, file.path)
      mkdirSync(dirname(path), { recursive: true })
      writeFileSync(path, "contents" in file ? file.contents : Buffer.from(file.base64, "base64"))
      if (file.executable) chmodSync(path, 0o755)
    }

    const windows = process.platform === "win32"
    execFileSync(windows ? "cmd.exe" : "./gradlew", windows ? ["/c", "gradlew.bat", "build"] : ["build"], {
      cwd: dir,
      stdio: "inherit",
    })
    expect(existsSync(join(dir, "build/libs/gradle_check-1.0.0.jar"))).toBe(true)
  })
})
