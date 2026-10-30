// Opens a project from its folder; on failure shows why, with a way to forget it.
import { toast } from "@blocksy/ui"
import { errorMessage } from "./api"
import { useProject } from "./stores/project"
import { useRecent } from "./stores/recent"

export async function openProject(dir: string) {
  try {
    await useProject.getState().open(dir)
  } catch (err) {
    toast.error(`Couldn't open project: ${errorMessage(err)}`, {
      action: { label: "Remove from list", onClick: () => void useRecent.getState().forget(dir) },
    })
  }
}
