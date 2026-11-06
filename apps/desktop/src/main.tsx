// Entry point, shared by both windows (ADR 0020). The Modern theme is applied before the first
// paint (no flash), the window's app renders straight away, and boot() loads everything else after.
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { applyTheme, modernTheme } from "@blocksy/ui"
import { boot } from "./app/boot"
import { startBenchIfRequested } from "./app/bench"
import { hideNativeContextMenu } from "./app/native-menu"
import { windowKind } from "./shared/windows"
import "./index.css"

applyTheme(modernTheme)
hideNativeContextMenu()

const kind = windowKind()

// Each window loads only its own app, so the other one's start-up code and commands never run here.
async function render() {
  const App = kind === "editor" ? (await import("./app/editor-app")).EditorApp : (await import("./app/welcome-app")).WelcomeApp
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
void render()

void boot(kind)
void startBenchIfRequested()
