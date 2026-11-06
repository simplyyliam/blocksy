// The editor window's routes (react-router), ADR 0007 + ADR 0020. The welcome window has no router.
//
//   ProjectLayout (title bar, activity bar, status bar)
//   └─ /project/:projectId   Project editor
//   /                        a blank moment while the project opens
//
// A memory router: a desktop window has no address bar. The navigation store stays the
// simple way to move around (go("project")); it is connected to this router below.
import { createMemoryRouter } from "react-router-dom"
import { ProjectPage } from "../pages/project/project-page"
import { connectRouter, pageOf, useNavigation, type Page } from "../shared/stores/navigation"
import { useProject } from "../shared/stores/project"
import { ProjectLayout } from "./layouts/project-layout"
import { projectPath } from "../shared/project-path"

export const router = createMemoryRouter([
  { index: true, element: <div className="h-full" /> },
  {
    path: "project/:projectId",
    element: <ProjectLayout />,
    children: [{ index: true, element: <ProjectPage /> }],
  },
])

/** The URL for a page name. Project needs the open project's folder. */
function pathFor(page: Page): string {
  if (page === "project") {
    const dir = useProject.getState().current?.dir
    return dir ? projectPath(dir) : "/"
  }
  return "/"
}

connectRouter({ navigate: (to) => void router.navigate(to), pathFor })

// Keep the store's `page` in step with the route.
router.subscribe(({ location }) => useNavigation.setState({ page: pageOf(location.pathname) }))
