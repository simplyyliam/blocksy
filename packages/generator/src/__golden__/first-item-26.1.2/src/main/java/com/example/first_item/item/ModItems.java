// Written by Blocksy from your project. Edit the project in Blocksy: changes here are replaced on the next build.
package com.example.first_item.item;

import java.util.function.Function;
import java.util.List;

import net.fabricmc.fabric.api.registry.FuelValueEvents;
import net.minecraft.ChatFormatting;
import net.minecraft.core.component.DataComponents;
import net.minecraft.core.Registry;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.core.registries.Registries;
import net.minecraft.network.chat.Component;
import net.minecraft.resources.Identifier;
import net.minecraft.resources.ResourceKey;
import net.minecraft.world.effect.MobEffectInstance;
import net.minecraft.world.effect.MobEffects;
import net.minecraft.world.food.FoodProperties;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.Rarity;
import net.minecraft.world.item.component.Consumables;
import net.minecraft.world.item.component.ItemLore;
import net.minecraft.world.item.consume_effects.ApplyStatusEffectsConsumeEffect;
import net.minecraft.world.level.block.ComposterBlock;

import static com.example.first_item.FirstItem.MOD_ID;

/** Every item in the mod (blocks get their items in ModBlocks). */
public final class ModItems {
	// Berry Dough: fuel (100 ticks), compostable (65%), stacks to 64.
	public static final Item BERRY_DOUGH = register(
		"berry_dough",
		Item::new,
		new Item.Properties()
	);

	// Berry Bun: food (6 hunger, 1 effect), compostable (100%), stacks to 64.
	public static final Item BERRY_BUN = register(
		"berry_bun",
		Item::new,
		new Item.Properties()
			.food(new FoodProperties.Builder().nutrition(6).saturationModifier(0.8f).build(),
				Consumables.defaultFood()
					.onConsume(new ApplyStatusEffectsConsumeEffect(new MobEffectInstance(MobEffects.SPEED, 200, 0), 1.0f))
					.build())
			.component(DataComponents.LORE, new ItemLore(List.of(
					line("item.first_item.berry_bun.tooltip.0"),
					line("item.first_item.berry_bun.tooltip.1"))))
	);

	// Sky Gem: stacks to 16.
	public static final Item SKY_GEM = register(
		"sky_gem",
		Item::new,
		new Item.Properties()
			.stacksTo(16)
			.rarity(Rarity.RARE)
			.fireResistant()
	);

	// Sky Dust: stacks to 64.
	public static final Item SKY_DUST = register(
		"sky_dust",
		Item::new,
		new Item.Properties()
	);

	/** Registers an item under an id like "first_item:berry_dough". */
	private static Item register(String name, Function<Item.Properties, Item> factory, Item.Properties properties) {
		ResourceKey<Item> key = ResourceKey.create(Registries.ITEM, Identifier.fromNamespaceAndPath(MOD_ID, name));
		return Registry.register(BuiltInRegistries.ITEM, key, factory.apply(properties.setId(key)));
	}

	/** One tooltip line: translated text, grey and upright (lore is purple italic by default). */
	private static Component line(String key) {
		return Component.translatable(key).withStyle(style -> style.withColor(ChatFormatting.GRAY).withItalic(false));
	}

	/** Called from onInitialize. Java runs the fields above the first time this class is used. */
	public static void initialize() {
		// Furnace fuel: how many ticks each item burns (one smelt takes 200).
		FuelValueEvents.BUILD.register((builder, context) -> {
			builder.add(BERRY_DOUGH, 100);
		});

		// Composter: the chance that one item adds a layer.
		ComposterBlock.COMPOSTABLES.put(BERRY_DOUGH, 0.65f);
		ComposterBlock.COMPOSTABLES.put(BERRY_BUN, 1.0f);
	}

	private ModItems() {
	}
}
