// The mod's own files: metadata, Java entrypoints, language file, .gitignore.
import { deriveClassName, type GenerateContext } from "@blocksy/core"

/** Java package of the mod, e.g. "com.example.my_mod". */
export const javaPackage = ({ project }: GenerateContext) => `${project.group}.${project.modId}`

/** fabric.mod.json: tells Fabric the mod's id, name, entrypoints and what it needs. */
export const fabricModJson = (ctx: GenerateContext) => {
  const { project, version } = ctx
  const mainClass = deriveClassName(project.name)
  const json = {
    schemaVersion: 1,
    id: project.modId,
    version: "${version}", // filled in by Gradle (processResources in build.gradle)
    name: project.name,
    description: "Made with Blocksy.",
    authors: [],
    license: "All-Rights-Reserved",
    environment: "*",
    entrypoints: {
      main: [`${javaPackage(ctx)}.${mainClass}`],
      client: [`${javaPackage(ctx)}.client.${mainClass}Client`],
    },
    depends: {
      fabricloader: `>=${version.pins.loader}`,
      minecraft: `~${version.minecraft}`,
      java: `>=${version.java}`,
      "fabric-api": "*",
    },
  }
  return `${JSON.stringify(json, null, "\t")}\n`
}

/** Runs once when the game loads the mod. Later releases add registrations here. */
export const mainClass = (ctx: GenerateContext) => {
  const name = deriveClassName(ctx.project.name)
  return `package ${javaPackage(ctx)};

import net.fabricmc.api.ModInitializer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ${name} implements ModInitializer {
	public static final String MOD_ID = "${ctx.project.modId}";

	// Writes to the game log. Using the mod id as its name shows which mod said what.
	public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

	@Override
	public void onInitialize() {
		// Runs as soon as Minecraft is ready to load mods.
		LOGGER.info("${ctx.project.name} loaded");
	}
}
`
}

/** Runs only on the game client (never on servers), for rendering and screens. */
export const clientClass = (ctx: GenerateContext) => {
  const name = deriveClassName(ctx.project.name)
  return `package ${javaPackage(ctx)}.client;

import net.fabricmc.api.ClientModInitializer;

public class ${name}Client implements ClientModInitializer {
	@Override
	public void onInitializeClient() {
		// Client-only setup (rendering, screens) goes here.
	}
}
`
}

/** English names for everything in the mod. Empty until the first block or item. */
export const langJson = () => "{}\n"

export const gitignore = () => `# Gradle
.gradle/
build/
out/
classes/

# IDEs
.idea/
*.iml
.vscode/
.settings/
bin/
.classpath
.project

# OS
.DS_Store

# Fabric: the folder runClient plays in
run/

# Java crash logs
hs_err_*.log
replay_*.log
`
