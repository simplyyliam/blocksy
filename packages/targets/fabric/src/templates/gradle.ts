// Gradle build files, following the official Fabric template.
import type { GenerateContext } from "@blocksy/core"

/** Plugins, dependencies and Java settings for the mod. Versions live in gradle.properties. */
export const buildGradle = ({ project, version }: GenerateContext, datagen = false) => `plugins {
	id 'net.fabricmc.fabric-loom' version "\${loom_version}"
	id 'maven-publish'
}

repositories {
	// Loom adds the Minecraft and Fabric repositories automatically.
	// Add repositories here only when depending on other mods.
}

loom {
	// Keeps client-only code (rendering, screens) apart from code that also runs on servers.
	splitEnvironmentSourceSets()

	mods {
		"${project.modId}" {
			sourceSet sourceSets.main
			sourceSet sourceSets.client
		}
	}
}

${datagen ? DATAGEN : ""}dependencies {
	// To change the versions see the gradle.properties file
	minecraft "com.mojang:minecraft:\${project.minecraft_version}"
	implementation "net.fabricmc:fabric-loader:\${project.loader_version}"
	implementation "net.fabricmc.fabric-api:fabric-api:\${project.fabric_api_version}"
}

processResources {
	def version = project.version
	inputs.property "version", version

	// Puts the mod version into fabric.mod.json when building.
	filesMatching("fabric.mod.json") {
		expand "version": version
	}
}

tasks.withType(JavaCompile).configureEach {
	it.options.release = ${version.java}
}

java {
	withSourcesJar()
	sourceCompatibility = JavaVersion.VERSION_${version.java}
	targetCompatibility = JavaVersion.VERSION_${version.java}
}

publishing {
	publications {
		create("mavenJava", MavenPublication) {
			from components.java
		}
	}
}
`

/** Every pinned version in one place. Blocksy writes exact versions, never "latest". */
export const gradleProperties = ({ project, version }: GenerateContext) => `# Gives Gradle enough memory to set up Minecraft.
org.gradle.jvmargs=-Xmx1G
org.gradle.parallel=true
org.gradle.configuration-cache=true

# Fabric Properties (pinned and tested by Blocksy)
minecraft_version=${version.minecraft}
loader_version=${version.pins.loader}
loom_version=${version.pins.loom}

# Mod Properties
version=${project.version}
group=${project.group}

# Dependencies
fabric_api_version=${version.pins.fabricApi}
`

export const settingsGradle = ({ project }: GenerateContext) => `pluginManagement {
	repositories {
		maven {
			name = 'Fabric'
			url = 'https://maven.fabricmc.net/'
		}
		mavenCentral()
		gradlePluginPortal()
	}
}

// Should match your mod id
rootProject.name = '${project.modId}'
`

/** Tells gradlew which Gradle version to download on first run. */
export const wrapperProperties = ({ version }: GenerateContext) => `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-${version.pins.gradle}-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`

/** Fabric data generation, added once the mod has blocks. Runs with "gradlew runDatagen". */
const DATAGEN = `fabricApi {
	// Model generation is client-only code, so the data generator lives in the client source set.
	configureDataGeneration {
		client = true
	}
}

`
