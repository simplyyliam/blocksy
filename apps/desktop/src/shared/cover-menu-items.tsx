// "Change cover…" and "Use generated cover" for any project ··· menu (Home cards and
// the header breadcrumb), so both menus behave the same.
import { ImageIcon, Shapes } from "lucide-react"
import { DropdownMenuItem, toast } from "@blocksy/ui"
import { errorMessage } from "./api"
import { useCovers } from "./stores/covers"

export function CoverMenuItems({ dir }: { dir: string }) {
  const hasCustom = useCovers((s) => Boolean(s.byDir[dir]))

  const change = async () => {
    try {
      if (await useCovers.getState().choose(dir)) toast("Cover updated")
    } catch (err) {
      toast.error(`Couldn't use that picture: ${errorMessage(err)}`)
    }
  }
  const reset = async () => {
    try {
      await useCovers.getState().reset(dir)
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <>
      <DropdownMenuItem onClick={() => void change()}>
        <ImageIcon strokeWidth={1.75} /> Change cover…
      </DropdownMenuItem>
      {hasCustom && (
        <DropdownMenuItem onClick={() => void reset()}>
          <Shapes strokeWidth={1.75} /> Use generated cover
        </DropdownMenuItem>
      )}
    </>
  )
}
