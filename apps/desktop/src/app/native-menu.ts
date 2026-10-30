// The WebView's own right-click menu (Back, Reload, Inspect…) makes a desktop app feel
// like a web page. In release builds it is hidden everywhere except text you can edit
// or select, where Copy and Paste are useful. Blocksy's own context menus still work
// (they handle the event first). Dev builds keep it, for Inspect.
export function hideNativeContextMenu() {
  if (import.meta.env.DEV) return
  document.addEventListener("contextmenu", (e) => {
    const target = e.target as HTMLElement | null
    if (target?.closest("input, textarea, [contenteditable], [data-selectable]")) return
    e.preventDefault()
  })
}
