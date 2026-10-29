package com.example.aetheric_storage_engineering;

import net.fabricmc.api.ModInitializer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AethericStorageEngineering implements ModInitializer {
	public static final String MOD_ID = "aetheric_storage_engineering";

	// Writes to the game log. Using the mod id as its name shows which mod said what.
	public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

	@Override
	public void onInitialize() {
		// Runs as soon as Minecraft is ready to load mods.
		LOGGER.info("Aetheric Storage Engineering loaded");
	}
}
