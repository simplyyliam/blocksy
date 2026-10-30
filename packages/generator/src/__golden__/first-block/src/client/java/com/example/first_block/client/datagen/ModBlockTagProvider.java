// Written by Blocksy from your project. Edit the project in Blocksy: changes here are replaced on the next build.
package com.example.first_block.client.datagen;

import java.util.concurrent.CompletableFuture;

import net.fabricmc.fabric.api.datagen.v1.FabricPackOutput;
import net.fabricmc.fabric.api.datagen.v1.provider.FabricTagsProvider;
import net.minecraft.core.HolderLookup;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.resources.ResourceKey;
import net.minecraft.tags.BlockTags;
import net.minecraft.world.level.block.Block;

import com.example.first_block.block.ModBlocks;

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
		builder(BlockTags.MINEABLE_WITH_PICKAXE)
			.add(key(ModBlocks.FIRST_BLOCK))
			.add(key(ModBlocks.GLOW_BLOCK));
		builder(BlockTags.NEEDS_IRON_TOOL)
			.add(key(ModBlocks.GLOW_BLOCK));
	}

	/** Tags list blocks by their registry key ("<modid>:<id>"). */
	private static ResourceKey<Block> key(Block block) {
		return BuiltInRegistries.BLOCK.getResourceKey(block).orElseThrow();
	}
}
