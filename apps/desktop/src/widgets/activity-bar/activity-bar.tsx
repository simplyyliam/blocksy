// Activity bar widget: the narrow icon-only strip on the far left of the project editor
// (VS Code's). It holds routes, not lists: views that open as centre tabs, and the tools
// that open the bottom dock or Settings. The project's lists live in the explorer.
//   top:    Overview · Search · Library · History · Docs
//   bottom: Build log · Problems (count) · Settings
// Each icon is a command, so tooltips, shortcuts and pressed states match the menus.
// Width is the --b-activitybar-w token (shell-spec.md). Contents: features/activity-bar/.
import { ActivityItem } from "../../features/activity-bar/activity-item"
import { useProblems } from "../../features/bottom-panel/use-problems"

export function ActivityBar() {
  const problems = useProblems().length
  return (
    <nav aria-label="Activity bar" className="flex w-(--b-activitybar-w) shrink-0 flex-col items-center justify-between pb-1.5">
      <div className="flex flex-col items-center gap-1 pt-1">
        <ActivityItem id="project.overview" />
        <ActivityItem id="tools.palette" />
        <ActivityItem id="project.library" />
        <ActivityItem id="project.history" />
        <ActivityItem id="help.docs" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <ActivityItem id="build.log" />
        <ActivityItem id="tools.problems" badge={problems} />
        <ActivityItem id="file.settings" />
      </div>
    </nav>
  )
}
