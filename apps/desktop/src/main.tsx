// Entry point. The Modern theme is applied before the first paint (no flash),
// the shell renders straight away, and boot() loads everything else after.
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { applyTheme, modernTheme } from "@blocksy/ui"
import { App } from "./app/App"
import { boot } from "./app/boot"
import { startBenchIfRequested } from "./app/bench"
import { hideNativeContextMenu } from "./app/native-menu"
import "./index.css"

applyTheme(modernTheme)
hideNativeContextMenu()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

void boot()
void startBenchIfRequested()
