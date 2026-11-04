// The Item's Docs reference page is generated from this data (plan 11.2), and the editor
// shows the same labels and hints, so the two never drift apart.
// Java hints show vanilla Minecraft code (Item.Properties), not loader code.
import type { ElementDocs } from "@blocksy/core"

export const itemDocs: ElementDocs = {
  summary:
    "An item is anything you can hold that isn't a placed block: a gem, a tool part, a snack. Blocksy writes the Java that " +
    "registers it, its model, its texture (animated if it has frames) and its English name. Make it food, fuel or compostable " +
    "with a switch, and give it recipes with the Recipe element.",
  fields: [
    { key: "name", label: "Name", description: "The name players see. The id (like berry_bun) is made from the first name and never changes.", java: '"item.<modid>.<id>": "Name"  (en_us.json)' },
    { key: "texture", label: "Texture", description: "A 16x16 picture you paint on the canvas. Add frames to animate it: Blocksy writes the frames as one tall PNG plus a .mcmeta file.", java: "assets/<modid>/textures/item/<id>.png" },
    { key: "maxStackSize", label: "Stack size", description: "How many fit in one slot. Most items stack to 64, ender pearls to 16, tools to 1. Up to 99.", java: ".stacksTo(16)" },
    { key: "rarity", label: "Rarity", description: "Colours the item's name: common (white), uncommon (yellow), rare (aqua), epic (pink).", java: ".rarity(Rarity.RARE)" },
    { key: "fireResistant", label: "Fire resistant", description: "The dropped item survives fire and lava, like netherite.", java: ".fireResistant()" },
    { key: "food", label: "Food", description: "Makes the item edible. Nutrition fills the hunger bar (2 per drumstick); the saturation modifier decides how long you stay full.", java: ".food(new FoodProperties.Builder().nutrition(5).saturationModifier(0.6f).build())" },
    { key: "effects", label: "Food effects", description: "Status effects eating gives, with a duration, a level and a chance (1 = always).", java: "new ApplyStatusEffectsConsumeEffect(new MobEffectInstance(MobEffects.SPEED, 200, 0), 1.0f)" },
    { key: "fuelTicks", label: "Fuel", description: "How long it burns in a furnace, in ticks (20 = one second). One smelt takes 200 ticks; coal burns 1600 (8 items).", java: "builder.add(ModItems.BERRY_BUN, 200)" },
    { key: "compostChance", label: "Compost chance", description: "How likely one item adds a layer to a composter. Seeds are 30%, bread 85%.", java: "ComposterBlock.COMPOSTABLES.put(ModItems.BERRY_BUN, 0.85f)" },
    { key: "tooltip", label: "Tooltip", description: "Extra grey lines under the name when you hover the item. Each line gets its own translation key.", java: '"item.<modid>.<id>.tooltip.0": "Line"' },
    { key: "tab", label: "Creative tab", description: "The creative tab the item appears in. Make one with the Creative tab element." },
  ],
}

/** The docs entry for one field, for editor labels and hints. */
export const fieldDoc = (key: string) => itemDocs.fields.find((f) => f.key === key)!
