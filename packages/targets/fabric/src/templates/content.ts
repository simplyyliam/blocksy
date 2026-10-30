// The shared files that collect every element's pieces (ADR 0006):
//   block/ModBlocks.java            every block, registered with its item
//   item/ModCreativeTabs.java       every creative tab and what is in it
//   client/datagen/*.java           Fabric data generation: models, loot tables, tags
// Each element adds lines through its adapter (../elements/*.ts). An empty mod has
// no content, so none of these files exist and the empty-mod golden files stay the same.
import { deriveClassName, type GeneratedFile, type GenerateContext } from "@blocksy/core"
import { blockField, blockLang, blockTags, constant, type BlockElement } from "../elements/block.ts"
import { creativeTabField, creativeTabLang, type CreativeTabElement } from "../elements/creative-tab.ts"
import { javaPackage } from "./mod.ts"

/** What the mod contains, grouped the way the Fabric files need it. */
export interface Content {
  blocks: BlockElement[]
  tabs: CreativeTabElement[]
}

export function content(ctx: GenerateContext): Content {
  const elements = ctx.project.elements
  return {
    blocks: elements.filter((e) => e.type === "block") as BlockElement[],
    tabs: elements.filter((e) => e.type === "creative_tab") as CreativeTabElement[],
  }
}

/** Data generation runs only when there are blocks (models, loot and tags to write). */
export const needsDatagen = (c: Content) => c.blocks.length > 0

/** The calls onInitialize makes so the registries above run at the right time. */
export function initializers(c: Content): string[] {
  const calls: string[] = []
  if (c.blocks.length > 0) calls.push("ModBlocks.initialize();")
  if (c.tabs.length > 0) calls.push("ModCreativeTabs.initialize();")
  return calls
}

/** Imports the main class needs for those calls. */
export function initializerImports(ctx: GenerateContext, c: Content): string[] {
  const pkg = javaPackage(ctx)
  const imports: string[] = []
  if (c.blocks.length > 0) imports.push(`import ${pkg}.block.ModBlocks;`)
  if (c.tabs.length > 0) imports.push(`import ${pkg}.item.ModCreativeTabs;`)
  return imports
}

/** Every English name, in project order. */
export function langEntries(ctx: GenerateContext, c: Content): Record<string, string> {
  const modId = ctx.project.modId
  return Object.fromEntries([...c.blocks.map((b) => blockLang(b, modId)), ...c.tabs.map((t) => creativeTabLang(t, modId))])
}

/** The data generator class (client side, because model generation is client-only code). */
export const datagenClass = (ctx: GenerateContext) => `${javaPackage(ctx)}.client.datagen.ModDataGenerator`

export function contentFiles(ctx: GenerateContext, c: Content): GeneratedFile[] {
  const files: GeneratedFile[] = []
  if (c.blocks.length > 0) files.push({ path: `${ctx.paths.javaMain}/block/ModBlocks.java`, contents: modBlocks(ctx, c) })
  if (c.tabs.length > 0) files.push({ path: `${ctx.paths.javaMain}/item/ModCreativeTabs.java`, contents: modCreativeTabs(ctx, c) })
  if (needsDatagen(c)) {
    const dir = `${ctx.paths.javaClient}/datagen`
    files.push(
      { path: `${dir}/ModDataGenerator.java`, contents: dataGenerator(ctx) },
      { path: `${dir}/ModModelProvider.java`, contents: modelProvider(ctx, c) },
      { path: `${dir}/ModLootTableProvider.java`, contents: lootTableProvider(ctx, c) },
      { path: `${dir}/ModBlockTagProvider.java`, contents: blockTagProvider(ctx, c) },
    )
  }
  return files
}

const HEADER = "// Written by Blocksy from your project. Edit the project in Blocksy: changes here are replaced on the next build."

function modBlocks(ctx: GenerateContext, c: Content) {
  const pkg = javaPackage(ctx)
  const main = deriveClassName(ctx.project.name)
  return `${HEADER}
package ${pkg}.block;

import java.util.function.Function;

import net.minecraft.core.Registry;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.core.registries.Registries;
import net.minecraft.resources.Identifier;
import net.minecraft.resources.ResourceKey;
import net.minecraft.world.item.BlockItem;
import net.minecraft.world.item.Item;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.SoundType;
import net.minecraft.world.level.block.state.BlockBehaviour;
import net.minecraft.world.level.material.MapColor;

import static ${pkg}.${main}.MOD_ID;

/** Every block in the mod. Each one also gets an item, so you can hold and place it. */
public final class ModBlocks {
${c.blocks.map(blockField).join("\n\n")}

	/** Registers a block and its item under the same id, like "${ctx.project.modId}:${c.blocks[0]!.id}". */
	private static Block register(String name, Function<BlockBehaviour.Properties, Block> factory, BlockBehaviour.Properties properties) {
		ResourceKey<Block> blockKey = ResourceKey.create(Registries.BLOCK, Identifier.fromNamespaceAndPath(MOD_ID, name));
		Block block = factory.apply(properties.setId(blockKey));

		// The item uses the block's name ("block.<modid>.<id>") instead of an item name of its own.
		ResourceKey<Item> itemKey = ResourceKey.create(Registries.ITEM, Identifier.fromNamespaceAndPath(MOD_ID, name));
		Registry.register(BuiltInRegistries.ITEM, itemKey, new BlockItem(block, new Item.Properties().setId(itemKey).useBlockDescriptionPrefix()));

		return Registry.register(BuiltInRegistries.BLOCK, blockKey, block);
	}

	/** Called from onInitialize. Java runs the fields above the first time this class is used. */
	public static void initialize() {
	}

	private ModBlocks() {
	}
}
`
}

function modCreativeTabs(ctx: GenerateContext, c: Content) {
  const pkg = javaPackage(ctx)
  const main = deriveClassName(ctx.project.name)
  const fields = c.tabs.map((tab) => {
    const entries = c.blocks.filter((b) => b.data.tab === tab.id).map((b) => b.id)
    return creativeTabField(tab, entries, ctx.project.modId)
  })
  const usesBarrier = fields.some((f) => f.includes("Items.BARRIER"))
  const usesBlocks = fields.some((f) => f.includes("ModBlocks."))
  return `${HEADER}
package ${pkg}.item;

import net.fabricmc.fabric.api.creativetab.v1.FabricCreativeModeTab;
import net.minecraft.core.Registry;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.core.registries.Registries;
import net.minecraft.network.chat.Component;
import net.minecraft.resources.Identifier;
import net.minecraft.resources.ResourceKey;
import net.minecraft.world.item.CreativeModeTab;
import net.minecraft.world.item.ItemStack;
${usesBarrier ? "import net.minecraft.world.item.Items;\n" : ""}
${usesBlocks ? `import ${pkg}.block.ModBlocks;\n` : ""}
import static ${pkg}.${main}.MOD_ID;

/** The mod's tabs in the creative inventory. */
public final class ModCreativeTabs {
${fields.join("\n\n")}

	/** Called from onInitialize, after ModBlocks, so the blocks exist when the tabs list them. */
	public static void initialize() {
	}

	private ModCreativeTabs() {
	}
}
`
}

function dataGenerator(ctx: GenerateContext) {
  return `${HEADER}
package ${javaPackage(ctx)}.client.datagen;

import net.fabricmc.fabric.api.datagen.v1.DataGeneratorEntrypoint;
import net.fabricmc.fabric.api.datagen.v1.FabricDataGenerator;

/**
 * Fabric data generation: instead of hand-writing JSON, these providers describe the
 * mod's data in Java, and "gradlew runDatagen" writes the JSON into src/main/generated.
 * Blocksy runs it for you before every build.
 */
public class ModDataGenerator implements DataGeneratorEntrypoint {
	@Override
	public void onInitializeDataGenerator(FabricDataGenerator generator) {
		FabricDataGenerator.Pack pack = generator.createPack();
		pack.addProvider(ModModelProvider::new); // blockstates, block and item models
		pack.addProvider(ModLootTableProvider::new); // what each block drops
		pack.addProvider(ModBlockTagProvider::new); // which tool mines each block
	}
}
`
}

function modelProvider(ctx: GenerateContext, c: Content) {
  const pkg = javaPackage(ctx)
  return `${HEADER}
package ${pkg}.client.datagen;

import net.fabricmc.fabric.api.client.datagen.v1.provider.FabricModelProvider;
import net.fabricmc.fabric.api.datagen.v1.FabricPackOutput;
import net.minecraft.client.data.models.BlockModelGenerators;
import net.minecraft.client.data.models.ItemModelGenerators;

import ${pkg}.block.ModBlocks;

/** Models: how each block looks. */
public class ModModelProvider extends FabricModelProvider {
	public ModModelProvider(FabricPackOutput output) {
		super(output);
	}

	@Override
	public void generateBlockStateModels(BlockModelGenerators blocks) {
		// A full cube with one texture on all six faces (textures/block/<id>.png).
		// Also writes the block's item model, so it looks the same in your hand.
${c.blocks.map((b) => `\t\tblocks.createTrivialCube(ModBlocks.${constant(b.id)});`).join("\n")}
	}

	@Override
	public void generateItemModels(ItemModelGenerators items) {
		// Items arrive in Blocksy v0.3.
	}
}
`
}

function lootTableProvider(ctx: GenerateContext, c: Content) {
  const pkg = javaPackage(ctx)
  return `${HEADER}
package ${pkg}.client.datagen;

import java.util.concurrent.CompletableFuture;

import net.fabricmc.fabric.api.datagen.v1.FabricPackOutput;
import net.fabricmc.fabric.api.datagen.v1.provider.FabricBlockLootSubProvider;
import net.minecraft.core.HolderLookup;

import ${pkg}.block.ModBlocks;

/** Loot tables: what each block drops when it is broken. */
public class ModLootTableProvider extends FabricBlockLootSubProvider {
	public ModLootTableProvider(FabricPackOutput output, CompletableFuture<HolderLookup.Provider> registries) {
		super(output, registries);
	}

	@Override
	public void generate() {
		// dropSelf: the block drops itself as an item (when mined with the right tool,
		// if its properties say requiresCorrectToolForDrops).
${c.blocks.map((b) => `\t\tdropSelf(ModBlocks.${constant(b.id)});`).join("\n")}
	}
}
`
}

function blockTagProvider(ctx: GenerateContext, c: Content) {
  const pkg = javaPackage(ctx)
  // Group blocks by tag, in a stable order (tags in first-use order, blocks in project order).
  const byTag = new Map<string, string[]>()
  for (const block of c.blocks) {
    for (const tag of blockTags(block)) byTag.set(tag, [...(byTag.get(tag) ?? []), constant(block.id)])
  }
  // builder(tag).add(key) works the same on every pinned Minecraft version.
  const lines = [...byTag].map(
    ([tag, blocks]) => `\t\tbuilder(BlockTags.${tag})\n${blocks.map((b) => `\t\t\t.add(key(ModBlocks.${b}))`).join("\n")};`,
  )
  const tagImports = byTag.size > 0 ? "import net.minecraft.tags.BlockTags;\n" : ""
  const blockImports = byTag.size > 0 ? `\nimport ${pkg}.block.ModBlocks;\n` : ""
  return `${HEADER}
package ${pkg}.client.datagen;

import java.util.concurrent.CompletableFuture;

import net.fabricmc.fabric.api.datagen.v1.FabricPackOutput;
import net.fabricmc.fabric.api.datagen.v1.provider.FabricTagsProvider;
import net.minecraft.core.HolderLookup;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.resources.ResourceKey;
${tagImports}import net.minecraft.world.level.block.Block;
${blockImports}
/**
 * Block tags: mineable/<tool> makes the right tool mine the block fast,
 * needs_<tier>_tool sets the weakest tool tier that still makes it drop.
 */
public class ModBlockTagProvider extends FabricTagsProvider.BlockTagsProvider {
	public ModBlockTagProvider(FabricPackOutput output, CompletableFuture<HolderLookup.Provider> registries) {
		super(output, registries);
	}

	@Override
	protected void addTags(HolderLookup.Provider registries) {
${lines.join("\n") || "\t\t// No block needs a tool yet."}
	}

	/** Tags list blocks by their registry key ("<modid>:<id>"). */
	private static ResourceKey<Block> key(Block block) {
		return BuiltInRegistries.BLOCK.getResourceKey(block).orElseThrow();
	}
}
`
}
