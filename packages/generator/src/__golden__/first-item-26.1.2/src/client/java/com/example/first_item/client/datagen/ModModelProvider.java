// Written by Blocksy from your project. Edit the project in Blocksy: changes here are replaced on the next build.
package com.example.first_item.client.datagen;

import net.fabricmc.fabric.api.client.datagen.v1.provider.FabricModelProvider;
import net.fabricmc.fabric.api.datagen.v1.FabricPackOutput;
import net.minecraft.client.data.models.BlockModelGenerators;
import net.minecraft.client.data.models.ItemModelGenerators;
import net.minecraft.client.data.models.model.ModelTemplates;

import com.example.first_item.block.ModBlocks;
import com.example.first_item.item.ModItems;

/** Models: how each block looks. */
public class ModModelProvider extends FabricModelProvider {
	public ModModelProvider(FabricPackOutput output) {
		super(output);
	}

	@Override
	public void generateBlockStateModels(BlockModelGenerators blocks) {
		// A full cube with one texture on all six faces (textures/block/<id>.png).
		// Also writes the block's item model, so it looks the same in your hand.
		blocks.createTrivialCube(ModBlocks.BERRY_CRATE);
	}

	@Override
	public void generateItemModels(ItemModelGenerators items) {
		// A flat model: the item's texture as a sprite (textures/item/<id>.png).
		items.generateFlatItem(ModItems.BERRY_DOUGH, ModelTemplates.FLAT_ITEM);
		items.generateFlatItem(ModItems.BERRY_BUN, ModelTemplates.FLAT_ITEM);
		items.generateFlatItem(ModItems.SKY_GEM, ModelTemplates.FLAT_ITEM);
		items.generateFlatItem(ModItems.SKY_DUST, ModelTemplates.FLAT_ITEM);
	}
}
