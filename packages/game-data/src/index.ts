// @blocksy/game-data: vanilla ids (names only), item/tag references and the item picker.
// Public API of this package. Other packages may import only from here.
export * from "./refs.ts"
export { elementToMcItem, slotPicture, vanillaIds, type SlotPicture } from "./mc-item.ts"
export { VANILLA_BLOCK_TAGS, VANILLA_ITEM_TAGS, VANILLA_ITEMS } from "./vanilla.generated.ts"
export { elementTexture, ItemPicker, RefTile, type ItemPickerProps } from "./picker.tsx"
