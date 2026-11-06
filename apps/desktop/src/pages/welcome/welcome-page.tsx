// The welcome window (ADR 0020), laid out like JetBrains' welcome screen at its density.
// Fixed size, no resizing: a title bar, a left nav, the open view, and a footer.
//
//   ┌──────────────────────────────────────────────────── ─  ✕ ┐ 36
//   │ ▣ Blocksy                                                  │
//   ├───────────┬────────────────────────────────────────────────┤
//   │ ▣ Projects│  (Projects | Learn | Community | Settings)      │
//   │ ◧ Learn   │   or the New project view                       │
//   │ ☆ Commun… │                                                 │
//   │ ⚙ Settings│                                                 │
//   ├───────────┴────────────────────────────────────────────────┤
//   │ Blocksy 0.4.0 · Up to date · What's new           Sign in   │ 26
//   └─────────────────────────────────────────────────────────────┘
// Sizes are the shell tokens (--b-titlebar-h, --b-statusbar-h, --b-row-h), in both themes.
import type { ComponentType } from "react"
import { WindowControls } from "../../features/header/window-controls"
import { CommunityView } from "../../features/welcome/community-view"
import { LearnView } from "../../features/welcome/learn-view"
import { ProjectsView } from "../../features/welcome/projects-view"
import { SettingsView } from "../../features/welcome/settings-view"
import { StartGate } from "../../features/welcome/start-gate"
import { NewProjectView } from "../../features/new-project/new-project-view"
import { useSettings } from "../../shared/stores/settings"
import { useWelcome, type WelcomeView } from "../../shared/stores/welcome"
import { WelcomeFooter } from "../../widgets/welcome-footer/welcome-footer"
import { WelcomeNav } from "../../widgets/welcome-nav/welcome-nav"

const views: Record<WelcomeView, ComponentType> = {
  projects: ProjectsView,
  learn: LearnView,
  community: CommunityView,
  settings: SettingsView,
}

export function WelcomePage() {
  const view = useWelcome((s) => s.view)
  const creating = useWelcome((s) => s.creating)
  const loaded = useSettings((s) => s.loaded)
  const View = views[view]
  return (
    <div className="flex h-full flex-col">
      <header data-tauri-drag-region className="flex h-(--b-titlebar-h) shrink-0 items-center gap-2 pl-3">
        <img src="/favicon.svg" alt="" className="size-4" draggable={false} />
        <span data-tauri-drag-region className="flex-1 text-sm text-fg-muted">Blocksy</span>
        <WindowControls maximize={false} />
      </header>
      <StartGate state={{ loading: !loaded }}>
        <div className="flex min-h-0 flex-1">
          {!creating && <WelcomeNav />}
          {/* key replays the soft fade when the view changes */}
          <main key={creating ? "new" : view} className="page-enter min-h-0 min-w-0 flex-1 overflow-hidden">
            {creating ? <NewProjectView /> : <View />}
          </main>
        </div>
        <WelcomeFooter />
      </StartGate>
    </div>
  )
}
