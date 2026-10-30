package com.example.first_block;

import net.fabricmc.api.ModInitializer;

import com.example.first_block.block.ModBlocks;
import com.example.first_block.item.ModCreativeTabs;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class FirstBlock implements ModInitializer {
	public static final String MOD_ID = "first_block";

	// Writes to the game log. Using the mod id as its name shows which mod said what.
	public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

	@Override
	public void onInitialize() {
		// Runs as soon as Minecraft is ready to load mods.
		ModBlocks.initialize();
		ModCreativeTabs.initialize();
		LOGGER.info("First Block loaded");
	}
}
