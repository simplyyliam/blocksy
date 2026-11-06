// Clone from GitHub (by URL, public repositories for now; sign-in and private repos come with
// GitHub in v0.14). A small dialog over the Projects view:
//
//   Clone from GitHub
//   Repository URL  [ https://github.com/you/berry-mod.git ]
//   Folder          [ ~/Blocksy/berry-mod            ] [📂]
//                                        [Cancel] [Clone]
// After cloning, a folder with a blocksy.json opens in the editor; any other folder stays on disk
// and the dialog says it isn't a Blocksy project.
import { FolderOpen } from "lucide-react"
import { useEffect, useId, useState } from "react"
import { open as pickFolder } from "@tauri-apps/plugin-dialog"
import {
  Button, Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, Field, FieldDescription, FieldError, FieldLabel, Input, Spinner,
  Tooltip, TooltipContent, TooltipTrigger,
} from "@blocksy/ui"
import { call, errorMessage } from "../../shared/api"
import { commands } from "../../shared/bindings"
import { expandHome, joinPath, prettyPath } from "../../shared/paths"
import { PROJECT_FILE } from "../../shared/stores/project"
import { useSettings } from "../../shared/stores/settings"
import { useWelcome } from "../../shared/stores/welcome"
import { openProjectAt } from "./actions"
import { repoNameFromUrl, validateCloneUrl } from "./clone-url"

export function CloneDialog() {
  const open = useWelcome((s) => s.cloning)
  const setOpen = useWelcome((s) => s.setCloning)
  const { projectsDir, defaultProjectsDir, home } = useSettings()
  const [url, setUrl] = useState("")
  const [parent, setParent] = useState("")
  const [folderOverride, setFolderOverride] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ids = { url: useId(), folder: useId() }

  // A fresh form each time it opens.
  useEffect(() => {
    if (!open) return
    setUrl("")
    setFolderOverride(null)
    setError(null)
    setParent(projectsDir ?? defaultProjectsDir ?? "")
  }, [open, projectsDir, defaultProjectsDir])

  const urlProblem = url.trim() ? validateCloneUrl(url) : null
  const repo = repoNameFromUrl(url)
  const folder = folderOverride ?? (parent && repo ? joinPath(parent, repo) : parent)
  const valid = url.trim() !== "" && !urlProblem && folder.trim() !== ""

  const browse = async () => {
    const picked = await pickFolder({ directory: true, title: "Clone into", defaultPath: parent || undefined })
    if (typeof picked === "string") {
      setParent(picked)
      setFolderOverride(null)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid || busy) return
    setBusy(true)
    setError(null)
    try {
      await call(commands.gitClone(url.trim(), folder))
      if (await commands.pathExists(joinPath(folder, PROJECT_FILE))) {
        setOpen(false)
        await openProjectAt(folder)
      } else {
        setError("Cloned, but there's no blocksy.json in it, so it isn't a Blocksy project. The files are in the folder you chose.")
      }
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && setOpen(next)}>
      <DialogContent showCloseButton={false} className="w-[min(520px,calc(100vw-32px))] max-w-[calc(100vw-32px)] gap-0 rounded-dialog p-0 sm:max-w-[calc(100vw-32px)]">
        <form onSubmit={submit} className="flex flex-col gap-4 px-5 pt-5 pb-4">
          <div>
            <DialogTitle className="text-lg leading-normal text-fg">Clone from GitHub</DialogTitle>
            <DialogDescription className="mt-0.5 text-sm text-fg-muted">Public repositories, by address. Private ones arrive with GitHub sign-in.</DialogDescription>
          </div>
          <Field>
            <FieldLabel htmlFor={ids.url}>Repository URL</FieldLabel>
            <Input
              id={ids.url}
              autoFocus
              spellCheck={false}
              disabled={busy}
              aria-invalid={urlProblem ? true : undefined}
              placeholder="https://github.com/you/berry-mod.git"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            {urlProblem && <FieldError>{urlProblem}</FieldError>}
          </Field>
          <Field>
            <FieldLabel htmlFor={ids.folder}>Folder</FieldLabel>
            <div className="relative">
              <Input
                id={ids.folder}
                spellCheck={false}
                disabled={busy}
                value={prettyPath(folder, home)}
                onChange={(e) => setFolderOverride(expandHome(e.target.value, home))}
                className="pr-11"
              />
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      type="button"
                      disabled={busy}
                      aria-label="Choose folder"
                      onClick={() => void browse()}
                      className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
                    />
                  }
                >
                  <FolderOpen strokeWidth={1.75} />
                </TooltipTrigger>
                <TooltipContent>Choose folder</TooltipContent>
              </Tooltip>
            </div>
            <FieldDescription>The folder is created for you and must be empty or new.</FieldDescription>
          </Field>
          <div className="flex min-h-9 items-center justify-between gap-4">
            <p className="min-w-0 text-sm text-danger" role="alert">
              {error}
            </p>
            <div className="flex shrink-0 gap-2">
              <DialogClose render={<Button variant="outline" size="sm" type="button" disabled={busy} className="border-line-subtle bg-subtle" />}>Cancel</DialogClose>
              <Button size="sm" type="submit" disabled={!valid || busy} className="px-4">
                {busy && <Spinner />}
                {busy ? "Cloning…" : "Clone"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
