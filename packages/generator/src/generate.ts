// The generator: (project data, target) -> files. Pure: no UI, no disk, no clock,
// no randomness. The same project always produces byte-identical output, which
// the golden tests check. Writing the files to disk is the app's job.
import type { GeneratedFile, GenerateContext, Project, Registries } from "@blocksy/core"
import { validateProject } from "@blocksy/core"

export class GenerateError extends Error {}

export function generate(project: Project, registries: Registries): GeneratedFile[] {
  const problems = validateProject(project, registries)
  if (problems.length > 0) throw new GenerateError(problems.join("\n"))

  const target = registries.loaderTargets.require(project.target)
  const version = target.versions.find((v) => v.minecraft === project.minecraftVersion)!
  const ctx: GenerateContext = { project, version, paths: target.paths(project) }

  // 1. The target's empty mod. 2. One template per element, chosen by target id.
  const files = [...target.scaffold(ctx)]
  for (const element of project.elements) {
    const type = registries.elementTypes.require(element.type)
    // The element's own template for this target, else the target's adapter for it (ADR 0006).
    const template = type.templates[target.id] ?? target.adapters?.[type.id]
    if (!template) throw new GenerateError(`${type.name} has no ${target.name} template yet`)
    files.push(...template(element, ctx))
  }

  // Two templates writing the same file is always a bug: fail loudly.
  const seen = new Set<string>()
  for (const file of files) {
    if (seen.has(file.path)) throw new GenerateError(`Two templates both write ${file.path}`)
    seen.add(file.path)
  }

  // Stable order, so output (and its snapshots) never depend on registration order.
  return files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
}
