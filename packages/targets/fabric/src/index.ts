// @blocksy/target-fabric: Fabric loader target: templates, file layout and API adapters.
// Public API of this package. Other packages may import only from here.
import type { GeneratedFile, GenerateContext, LoaderTarget } from "@blocksy/core"
import { deriveClassName } from "@blocksy/core"
import { buildGradle, gradleProperties, settingsGradle, wrapperProperties } from "./templates/gradle.ts"
import { clientClass, fabricModJson, gitignore, langJson, mainClass } from "./templates/mod.ts"
import { content, contentFiles, contentOf, langEntries, needsDatagen } from "./templates/content.ts"
import { blockTemplate } from "./elements/block.ts"
import { creativeTabTemplate } from "./elements/creative-tab.ts"
import { GRADLE_WRAPPER_JAR_BASE64, GRADLEW, GRADLEW_BAT } from "./wrapper.generated.ts"
import { FABRIC_VERSIONS } from "./versions.ts"

export { DEFAULT_MINECRAFT_VERSION, FABRIC_VERSIONS } from "./versions.ts"

/** Fabric's folder layout (with client code split out, as in the official template). */
function paths(project: GenerateContext["project"]) {
  const pkg = `${project.group}.${project.modId}`.replaceAll(".", "/")
  return {
    javaMain: `src/main/java/${pkg}`,
    javaClient: `src/client/java/${pkg}/client`,
    resources: "src/main/resources",
    assets: `src/main/resources/assets/${project.modId}`,
  }
}

function scaffold(ctx: GenerateContext): GeneratedFile[] {
  const p = ctx.paths
  const className = deriveClassName(ctx.project.name)
  // What the mod contains (blocks, tabs). Empty for a new mod, which keeps its files unchanged.
  const c = content(ctx)
  return [
    { path: ".gitignore", contents: gitignore() },
    { path: "build.gradle", contents: buildGradle(ctx, needsDatagen(c)) },
    { path: "gradle.properties", contents: gradleProperties(ctx) },
    { path: "settings.gradle", contents: settingsGradle(ctx) },
    { path: "gradle/wrapper/gradle-wrapper.properties", contents: wrapperProperties(ctx) },
    { path: "gradle/wrapper/gradle-wrapper.jar", base64: GRADLE_WRAPPER_JAR_BASE64 },
    { path: "gradlew", contents: GRADLEW, executable: true },
    { path: "gradlew.bat", contents: GRADLEW_BAT },
    { path: `${p.javaMain}/${className}.java`, contents: mainClass(ctx, c) },
    { path: `${p.javaClient}/${className}Client.java`, contents: clientClass(ctx) },
    { path: `${p.resources}/fabric.mod.json`, contents: fabricModJson(ctx, c) },
    { path: `${p.assets}/lang/en_us.json`, contents: langJson(langEntries(ctx, c)) },
    // Files that collect every element's pieces (ModBlocks, creative tabs, data generation).
    ...contentFiles(ctx, c),
  ]
}

export const fabricTarget: LoaderTarget = {
  id: "fabric",
  name: "Fabric",
  versions: FABRIC_VERSIONS,
  paths,
  scaffold,
  // Fabric code for each element type (ADR 0006). The shared files are in templates/content.ts.
  adapters: {
    block: blockTemplate,
    creative_tab: creativeTabTemplate,
  },
  // Blocks need their models, loot tables and tags generated before building or running.
  // Same rule that adds datagen to build.gradle and fabric.mod.json (needsDatagen).
  prepareTasks: (project) => (needsDatagen(contentOf(project)) ? ["runDatagen"] : []),
}
