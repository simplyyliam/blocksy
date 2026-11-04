// Written by Blocksy from your project. Edit the project in Blocksy: changes here are replaced on the next build.
package com.example.first_item.item;

import net.fabricmc.fabric.api.creativetab.v1.FabricCreativeModeTab;
import net.minecraft.core.Registry;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.core.registries.Registries;
import net.minecraft.network.chat.Component;
import net.minecraft.resources.Identifier;
import net.minecraft.resources.ResourceKey;
import net.minecraft.world.item.CreativeModeTab;
import net.minecraft.world.item.ItemStack;

import com.example.first_item.block.ModBlocks;

import static com.example.first_item.FirstItem.MOD_ID;

/** The mod's tabs in the creative inventory. */
public final class ModCreativeTabs {
	// First Item: 1 block, 3 items.
	public static final CreativeModeTab FIRST_ITEM_TAB = Registry.register(
		BuiltInRegistries.CREATIVE_MODE_TAB,
		ResourceKey.create(Registries.CREATIVE_MODE_TAB, Identifier.fromNamespaceAndPath(MOD_ID, "first_item_tab")),
		FabricCreativeModeTab.builder()
			.title(Component.translatable("itemGroup.first_item.first_item_tab"))
			.icon(() -> new ItemStack(ModItems.BERRY_BUN))
			.displayItems((parameters, output) -> {
				output.accept(ModBlocks.BERRY_CRATE);
				output.accept(ModItems.BERRY_DOUGH);
				output.accept(ModItems.BERRY_BUN);
				output.accept(ModItems.SKY_GEM);
			})
			.build()
	);

	/** Called from onInitialize, after ModBlocks and ModItems, so they exist when the tabs list them. */
	public static void initialize() {
	}

	private ModCreativeTabs() {
	}
}
