package com.example.first_item;

import net.fabricmc.api.ModInitializer;

import com.example.first_item.block.ModBlocks;
import com.example.first_item.item.ModCreativeTabs;
import com.example.first_item.item.ModItems;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class FirstItem implements ModInitializer {
	public static final String MOD_ID = "first_item";

	// Writes to the game log. Using the mod id as its name shows which mod said what.
	public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

	@Override
	public void onInitialize() {
		// Runs as soon as Minecraft is ready to load mods.
		ModBlocks.initialize();
		ModItems.initialize();
		ModCreativeTabs.initialize();
		LOGGER.info("First Item loaded");
	}
}
