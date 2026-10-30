// Written by Blocksy from your project. Edit the project in Blocksy: changes here are replaced on the next build.
package com.example.first_block.client.datagen;

import net.fabricmc.fabric.api.client.datagen.v1.provider.FabricModelProvider;
import net.fabricmc.fabric.api.datagen.v1.FabricPackOutput;
import net.minecraft.client.data.models.BlockModelGenerators;
import net.minecraft.client.data.models.ItemModelGenerators;

import com.example.first_block.block.ModBlocks;

/** Models: how each block looks. */
public class ModModelProvider extends FabricModelProvider {
	public ModModelProvider(FabricPackOutput output) {
		super(output);
	}

	@Override
	public void generateBlockStateModels(BlockModelGenerators blocks) {
		// A full cube with one texture on all six faces (textures/block/<id>.png).
		// Also writes the block's item model, so it looks the same in your hand.
		blocks.createTrivialCube(ModBlocks.FIRST_BLOCK);
		blocks.createTrivialCube(ModBlocks.GLOW_BLOCK);
		blocks.createTrivialCube(ModBlocks.SOFT_BLOCK);
	}

	@Override
	public void generateItemModels(ItemModelGenerators items) {
		// Items arrive in Blocksy v0.3.
	}
}
