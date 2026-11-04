// Fixed choices for the Item's fields. Ids match Minecraft's own names (Rarity.RARE,
// MobEffects.SPEED), so templates turn them into Java with toUpperCase().

export const RARITIES = [
  { id: "common", label: "Common", note: "White name" },
  { id: "uncommon", label: "Uncommon", note: "Yellow name" },
  { id: "rare", label: "Rare", note: "Aqua name" },
  { id: "epic", label: "Epic", note: "Pink name" },
] as const
export const RARITY_IDS = ["common", "uncommon", "rare", "epic"] as const

/** Status effects food can give (Minecraft's MobEffects, the ones that make sense on food). */
export const EFFECTS = [
  { id: "speed", label: "Speed" },
  { id: "slowness", label: "Slowness" },
  { id: "haste", label: "Haste" },
  { id: "mining_fatigue", label: "Mining fatigue" },
  { id: "strength", label: "Strength" },
  { id: "instant_health", label: "Instant health" },
  { id: "instant_damage", label: "Instant damage" },
  { id: "jump_boost", label: "Jump boost" },
  { id: "nausea", label: "Nausea" },
  { id: "regeneration", label: "Regeneration" },
  { id: "resistance", label: "Resistance" },
  { id: "fire_resistance", label: "Fire resistance" },
  { id: "water_breathing", label: "Water breathing" },
  { id: "invisibility", label: "Invisibility" },
  { id: "blindness", label: "Blindness" },
  { id: "night_vision", label: "Night vision" },
  { id: "hunger", label: "Hunger" },
  { id: "weakness", label: "Weakness" },
  { id: "poison", label: "Poison" },
  { id: "wither", label: "Wither" },
  { id: "health_boost", label: "Health boost" },
  { id: "absorption", label: "Absorption" },
  { id: "saturation", label: "Saturation" },
  { id: "glowing", label: "Glowing" },
  { id: "levitation", label: "Levitation" },
  { id: "luck", label: "Luck" },
  { id: "slow_falling", label: "Slow falling" },
  { id: "dolphins_grace", label: "Dolphin's grace" },
  { id: "darkness", label: "Darkness" },
] as const
export const EFFECT_IDS = EFFECTS.map((e) => e.id) as unknown as readonly [(typeof EFFECTS)[number]["id"], ...(typeof EFFECTS)[number]["id"][]]

/** One furnace smelt takes 200 ticks (10 seconds), so fuel is easiest to read as "smelts N items". */
export const TICKS_PER_SMELT = 200

/** Familiar fuels, to compare against (game facts). */
export const FUEL_EXAMPLES = [
  { name: "Stick", ticks: 100 },
  { name: "Planks", ticks: 300 },
  { name: "Coal", ticks: 1600 },
  { name: "Blaze rod", ticks: 2400 },
  { name: "Lava bucket", ticks: 20000 },
]
