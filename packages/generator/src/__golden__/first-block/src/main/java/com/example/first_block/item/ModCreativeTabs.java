// Written by Blocksy from your project. Edit the project in Blocksy: changes here are replaced on the next build.
package com.example.first_block.item;

import net.fabricmc.fabric.api.creativetab.v1.FabricCreativeModeTab;
import net.minecraft.core.Registry;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.core.registries.Registries;
import net.minecraft.network.chat.Component;
import net.minecraft.resources.Identifier;
import net.minecraft.resources.ResourceKey;
import net.minecraft.world.item.CreativeModeTab;
import net.minecraft.world.item.ItemStack;

import com.example.first_block.block.ModBlocks;

import static com.example.first_block.FirstBlock.MOD_ID;

/** The mod's tabs in the creative inventory. */
public final class ModCreativeTabs {
	// First Block: 2 blocks.
	public static final ResourceKey<CreativeModeTab> FIRST_BLOCK_TAB_KEY = ResourceKey.create(
		Registries.CREATIVE_MODE_TAB, Identifier.fromNamespaceAndPath(MOD_ID, "first_block_tab"));
	public static final CreativeModeTab FIRST_BLOCK_TAB = Registry.register(
		BuiltInRegistries.CREATIVE_MODE_TAB,
		FIRST_BLOCK_TAB_KEY,
		FabricCreativeModeTab.builder()
			.title(Component.translatable("itemGroup.first_block.first_block_tab"))
			.icon(() -> new ItemStack(ModBlocks.GLOW_BLOCK))
			.displayItems((parameters, output) -> {
				output.accept(ModBlocks.FIRST_BLOCK);
				output.accept(ModBlocks.GLOW_BLOCK);
			})
			.build()
	);

	/** Called from onInitialize, after ModBlocks, so the blocks exist when the tabs list them. */
	public static void initialize() {
	}

	private ModCreativeTabs() {
	}
}
