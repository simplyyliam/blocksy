// Written by Blocksy from your project. Edit the project in Blocksy: changes here are replaced on the next build.
package com.example.first_block.block;

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

import static com.example.first_block.FirstBlock.MOD_ID;

/** Every block in the mod. Each one also gets an item, so you can hold and place it. */
public final class ModBlocks {
	// First Block: hardness 1.5, blast resistance 6, mined with a pickaxe.
	public static final Block FIRST_BLOCK = register(
		"first_block",
		Block::new,
		BlockBehaviour.Properties.of()
			.strength(1.5f, 6.0f)
			.requiresCorrectToolForDrops()
			.sound(SoundType.STONE)
			.mapColor(MapColor.STONE)
	);

	// Glow Block: hardness 5, blast resistance 6, needs an iron pickaxe or better.
	public static final Block GLOW_BLOCK = register(
		"glow_block",
		Block::new,
		BlockBehaviour.Properties.of()
			.strength(5.0f, 6.0f)
			.requiresCorrectToolForDrops()
			.lightLevel(state -> 15)
			.sound(SoundType.GLASS)
			.mapColor(MapColor.GOLD)
	);

	// Soft Block: hardness 0.5, blast resistance 0.5, mined by hand.
	public static final Block SOFT_BLOCK = register(
		"soft_block",
		Block::new,
		BlockBehaviour.Properties.of()
			.strength(0.5f, 0.5f)
			.sound(SoundType.WOOL)
			.mapColor(MapColor.COLOR_PINK)
	);

	/** Registers a block and its item under the same id, like "first_block:first_block". */
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
