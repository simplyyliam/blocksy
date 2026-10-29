// The full set of registries Blocksy knows about. The app creates one set at
// startup and registers every module into it (apps/desktop/src/app/modules.ts).
import { createRegistry, type Registry } from "./registry.ts"
import type {
  DocsDemo,
  ElementType,
  GuiComponent,
  LoaderTarget,
  ModelFormat,
  ModelStudioTool,
  NodeType,
  Theme,
} from "./modules.ts"
import type { Project } from "./project.ts"

export interface Registries {
  // Each element type has its own data shape; its schema checks it at runtime.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  elementTypes: Registry<ElementType<any>>
  nodeTypes: Registry<NodeType>
  guiComponents: Registry<GuiComponent>
  modelFormats: Registry<ModelFormat>
  modelStudioTools: Registry<ModelStudioTool>
  loaderTargets: Registry<LoaderTarget>
  themes: Registry<Theme>
  docsDemos: Registry<DocsDemo>
}

export function createRegistries(): Registries {
  return {
    elementTypes: createRegistry("element type"),
    nodeTypes: createRegistry("node type"),
    guiComponents: createRegistry("GUI component"),
    modelFormats: createRegistry("model format"),
    modelStudioTools: createRegistry("Model Studio tool"),
    loaderTargets: createRegistry("loader target"),
    themes: createRegistry("theme"),
    docsDemos: createRegistry("docs demo"),
  }
}

/** Checks what the schema can't: known target and version, valid element data. */
export function validateProject(project: Project, registries: Registries): string[] {
  const problems: string[] = []
  const target = registries.loaderTargets.get(project.target)
  if (!target) {
    problems.push(`Unknown loader target "${project.target}"`)
  } else if (!target.versions.some((v) => v.minecraft === project.minecraftVersion)) {
    problems.push(`${target.name} has no tested setup for Minecraft ${project.minecraftVersion}`)
  }
  for (const element of project.elements) {
    const type = registries.elementTypes.get(element.type)
    if (!type) {
      problems.push(`"${element.name}" uses unknown element type "${element.type}"`)
      continue
    }
    const result = type.schema.safeParse(element.data)
    if (!result.success) problems.push(`"${element.name}": ${result.error.issues[0]?.message}`)
  }
  return problems
}
