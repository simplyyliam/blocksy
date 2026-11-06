// Actions behind the project menus (kept apart from the menu components so they can be
// shared with the command registry): change the cover, close the project (back to the welcome window).
import { toast } from "@blocksy/ui"
import { errorMessage } from "./api"
import { useCovers } from "./stores/covers"
import { useGradle } from "./stores/gradle"
import { useProject } from "./stores/project"
import { showWelcome, type WelcomeIntent } from "./windows"

export async function changeCover(dir: string) {
  try {
    if (await useCovers.getState().choose(dir)) toast("Cover updated")
  } catch (err) {
    toast.error(`Couldn't use that picture: ${errorMessage(err)}`)
  }
}

/** Closes the project and brings the welcome window back (the editor window closes). */
export async function closeProject(intent?: WelcomeIntent) {
  try {
    // A running build or game belongs to this project: stop it before the window goes,
    // and write the last edit that autosave has not written yet.
    if (useGradle.getState().task !== null) await useGradle.getState().stop()
    await useProject.getState().flush()
    await showWelcome({ intent })
    useProject.getState().close()
  } catch (err) {
    toast.error(errorMessage(err))
  }
}
