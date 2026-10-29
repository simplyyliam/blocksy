// @blocksy/target-fabric: Fabric loader target: templates, file layout and API adapters.
// Public API of this package. Other packages may import only from here.
import type { GeneratedFile, GenerateContext, LoaderTarget } from "@blocksy/core"
import { deriveClassName } from "@blocksy/core"
import { buildGradle, gradleProperties, settingsGradle, wrapperProperties } from "./templates/gradle.ts"
import { clientClass, fabricModJson, gitignore, langJson, mainClass } from "./templates/mod.ts"
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
  return [
    { path: ".gitignore", contents: gitignore() },
    { path: "build.gradle", contents: buildGradle(ctx) },
    { path: "gradle.properties", contents: gradleProperties(ctx) },
    { path: "settings.gradle", contents: settingsGradle(ctx) },
    { path: "gradle/wrapper/gradle-wrapper.properties", contents: wrapperProperties(ctx) },
    { path: "gradle/wrapper/gradle-wrapper.jar", base64: GRADLE_WRAPPER_JAR_BASE64 },
    { path: "gradlew", contents: GRADLEW, executable: true },
    { path: "gradlew.bat", contents: GRADLEW_BAT },
    { path: `${p.javaMain}/${className}.java`, contents: mainClass(ctx) },
    { path: `${p.javaClient}/${className}Client.java`, contents: clientClass(ctx) },
    { path: `${p.resources}/fabric.mod.json`, contents: fabricModJson(ctx) },
    { path: `${p.assets}/lang/en_us.json`, contents: langJson() },
  ]
}

export const fabricTarget: LoaderTarget = {
  id: "fabric",
  name: "Fabric",
  versions: FABRIC_VERSIONS,
  paths,
  scaffold,
}
