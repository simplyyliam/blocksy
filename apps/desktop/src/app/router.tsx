// The app's routes (react-router). Two layouts, each rendering its pages in an <Outlet>:
//
//   AppLayout (icon rail)          ProjectLayout (no rail, back button)
//   ├─ /          Home             └─ /project/:projectId   Project editor
//   ├─ /docs/*    Docs
//   └─ /jdk       JDK setup
//
// A memory router: a desktop window has no address bar. The navigation store stays the
// simple way to move around (go("docs")); it is connected to this router below.
import { createMemoryRouter } from "react-router-dom"
import { DocsPage } from "../pages/docs/docs-page"
import { HomePage } from "../pages/home/home-page"
import { JdkPage } from "../pages/jdk/jdk-page"
import { ProjectPage } from "../pages/project/project-page"
import { connectRouter, pageOf, useNavigation, type Page } from "../shared/stores/navigation"
import { useProject } from "../shared/stores/project"
import { AppLayout } from "./layouts/app-layout"
import { ProjectLayout } from "./layouts/project-layout"
import { projectPath } from "../shared/project-path"

export const router = createMemoryRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "docs/*", element: <DocsPage /> },
      { path: "jdk", element: <JdkPage /> },
    ],
  },
  {
    path: "project/:projectId",
    element: <ProjectLayout />,
    children: [{ index: true, element: <ProjectPage /> }],
  },
])

/** The URL for a page name. Project needs the open project's folder. */
function pathFor(page: Page): string {
  if (page === "docs") return useNavigation.getState().docsPath
  if (page === "jdk") return "/jdk"
  if (page === "project") {
    const dir = useProject.getState().current?.dir
    return dir ? projectPath(dir) : "/"
  }
  return "/"
}

connectRouter({ navigate: (to) => void router.navigate(to), pathFor })

// Keep the store's `page` (and the last Docs page) in step with the route.
router.subscribe(({ location }) => {
  const page = pageOf(location.pathname)
  useNavigation.setState(page === "docs" ? { page, docsPath: location.pathname } : { page })
})
