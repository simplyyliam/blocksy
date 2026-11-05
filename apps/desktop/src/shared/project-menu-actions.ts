// Actions behind the project menus (kept apart from the menu components so they can be
// shared with the command registry): change the cover, close the project.
import { toast } from "@blocksy/ui"
import { errorMessage } from "./api"
import { useCovers } from "./stores/covers"
import { useNavigation } from "./stores/navigation"
import { useProject } from "./stores/project"

export async function changeCover(dir: string) {
  try {
    if (await useCovers.getState().choose(dir)) toast("Cover updated")
  } catch (err) {
    toast.error(`Couldn't use that picture: ${errorMessage(err)}`)
  }
}

export function closeProject() {
  useProject.getState().close()
  useNavigation.getState().go("home")
}
