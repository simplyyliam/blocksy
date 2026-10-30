// The status bar look (VS Code / macOS menu bar): plain text and icons, no pills.
// A clickable item only shows a faint background on hover.
/** A plain status item (text with an icon). */
export const statusItem = "flex h-6 shrink-0 items-center gap-1.5 px-1.5 text-xs whitespace-nowrap text-fg-muted [&_svg]:size-3.5 [&_svg]:shrink-0"
/** className for a ghost Button in the status bar. */
export const statusButton = "h-6 gap-1.5 rounded-sm px-1.5 text-xs font-normal text-fg-muted hover:text-fg [&_svg]:size-3.5!"
