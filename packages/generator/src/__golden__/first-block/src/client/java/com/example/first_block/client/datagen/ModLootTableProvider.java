// Written by Blocksy from your project. Edit the project in Blocksy: changes here are replaced on the next build.
package com.example.first_block.client.datagen;

import java.util.concurrent.CompletableFuture;

import net.fabricmc.fabric.api.datagen.v1.FabricPackOutput;
import net.fabricmc.fabric.api.datagen.v1.provider.FabricBlockLootSubProvider;
import net.minecraft.core.HolderLookup;

import com.example.first_block.block.ModBlocks;

/** Loot tables: what each block drops when it is broken. */
public class ModLootTableProvider extends FabricBlockLootSubProvider {
	public ModLootTableProvider(FabricPackOutput output, CompletableFuture<HolderLookup.Provider> registries) {
		super(output, registries);
	}

	@Override
	public void generate() {
		// dropSelf: the block drops itself as an item (when mined with the right tool,
		// if its properties say requiresCorrectToolForDrops).
		dropSelf(ModBlocks.FIRST_BLOCK);
		dropSelf(ModBlocks.GLOW_BLOCK);
		dropSelf(ModBlocks.SOFT_BLOCK);
	}
}
