// Written by Blocksy from your project. Edit the project in Blocksy: changes here are replaced on the next build.
package com.example.first_block.client.datagen;

import net.fabricmc.fabric.api.datagen.v1.DataGeneratorEntrypoint;
import net.fabricmc.fabric.api.datagen.v1.FabricDataGenerator;

/**
 * Fabric data generation: instead of hand-writing JSON, these providers describe the
 * mod's data in Java, and "gradlew runDatagen" writes the JSON into src/main/generated.
 * Blocksy runs it for you before every build.
 */
public class ModDataGenerator implements DataGeneratorEntrypoint {
	@Override
	public void onInitializeDataGenerator(FabricDataGenerator generator) {
		FabricDataGenerator.Pack pack = generator.createPack();
		pack.addProvider(ModModelProvider::new); // blockstates, block and item models
		pack.addProvider(ModLootTableProvider::new); // what each block drops
		pack.addProvider(ModBlockTagProvider::new); // which tool mines each block
	}
}
