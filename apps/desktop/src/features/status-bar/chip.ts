// The status bar look (VS Code / macOS menu bar): plain text and icons, no pills.
// Items are 22px tall with 12px text, 14px icons and 8px side padding (docs/design/shell-spec.md).
// A clickable item only shows a faint background on hover.
/** A plain status item (text with an icon). */
export const statusItem = "flex h-5.5 shrink-0 items-center gap-1.5 px-2 text-xs whitespace-nowrap text-fg-muted [&_svg]:size-3.5 [&_svg]:shrink-0"
/** className for a ghost Button in the status bar. */
export const statusButton = "h-5.5 gap-1.5 rounded-sm px-2 text-xs font-normal text-fg-muted hover:text-fg aria-expanded:bg-muted aria-expanded:text-fg [&_svg]:size-3.5!"
/** className for the popover a status item opens (always above the bar). */
export const statusPopover = "w-64 gap-1.5 p-3 text-sm"
