// Fabric adapter for the Creative tab element (ADR 0006). One tab becomes a field in
// ModCreativeTabs.java and a title in en_us.json. It writes no files of its own.
import type { Element, GeneratedFile } from "@blocksy/core"
import { constant } from "./block.ts"

export type CreativeTabElement = Element & { data: { icon: string | null } }

/** The adapter the generator calls for each tab: everything lives in shared files. */
export const creativeTabTemplate = (): GeneratedFile[] => []

/** The tab's field in ModCreativeTabs.java. `entries` are the ids of the blocks in it. */
export function creativeTabField(tab: CreativeTabElement, entries: string[], modId: string): string {
  const name = constant(tab.id)
  const iconId = entries.includes(tab.data.icon ?? "") ? tab.data.icon! : entries[0]
  // A tab needs an icon even while empty: the barrier is a stand-in until a block joins.
  const icon = iconId ? `ModBlocks.${constant(iconId)}` : "Items.BARRIER"
  const accepts = entries.map((id) => `\t\t\t\toutput.accept(ModBlocks.${constant(id)});`).join("\n")
  return `	// ${tab.name}: ${entries.length} block${entries.length === 1 ? "" : "s"}.
	public static final ResourceKey<CreativeModeTab> ${name}_KEY = ResourceKey.create(
		Registries.CREATIVE_MODE_TAB, Identifier.fromNamespaceAndPath(MOD_ID, "${tab.id}"));
	public static final CreativeModeTab ${name} = Registry.register(
		BuiltInRegistries.CREATIVE_MODE_TAB,
		${name}_KEY,
		FabricCreativeModeTab.builder()
			.title(Component.translatable("itemGroup.${modId}.${tab.id}"))
			.icon(() -> new ItemStack(${icon}))
			.displayItems((parameters, output) -> {
${accepts || "\t\t\t\t// Empty: pick this tab in a block's inspector to add the block here."}
			})
			.build()
	);`
}

export const creativeTabLang = (tab: CreativeTabElement, modId: string): [string, string] => [`itemGroup.${modId}.${tab.id}`, tab.name]
