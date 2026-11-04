// History: local version history (plan v0.3). "Save version" = a git commit of the project
// folder; the list shows every saved version, newest first.
//
//   History
//   [ What changed? (e.g. Added the berry bun) ] [ Save version ]
//   ● Added the berry bun         3 files · 2 min ago     [Restore]
//   ● First version               12 files · yesterday    [Restore]
//
// Restoring reads blocksy.json as it was in that version, migrates it, and applies it as
// ONE command, so Ctrl+Z brings back what you had. Nothing on disk is rewound by git.
import { GitCommitVertical, History as HistoryIcon, RotateCcw } from "lucide-react"
import { useEffect, useState } from "react"
import { openUrl } from "@tauri-apps/plugin-opener"
import { loadProject, serializeProject, type Command, type Project } from "@blocksy/core"
import {
  BlurFade, Button, Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, PixelLoader, toast,
} from "@blocksy/ui"
import { commands, type Version } from "../../shared/bindings"
import { call, errorMessage } from "../../shared/api"
import { joinPath } from "../../shared/paths"
import { PROJECT_FILE, useProject } from "../../shared/stores/project"

/** "2 min ago", "yesterday", "3 Nov": short and calm. */
function when(iso: string): string {
  const then = new Date(iso).getTime()
  const s = Math.round((Date.now() - then) / 1000)
  if (s < 45) return "just now"
  if (s < 3600) return `${Math.round(s / 60)} min ago`
  if (s < 86400) return `${Math.round(s / 3600)} h ago`
  if (s < 172800) return "yesterday"
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" })
}

/** Replaces the whole project with a saved version, as one undoable step. */
const restoreProject = (restored: Project, message: string): Command<Project> => ({ label: `Restore "${message}"`, run: () => restored })

export function History() {
  const project = useProject((s) => s.current)
  const [versions, setVersions] = useState<Version[] | null>(null)
  const [available, setAvailable] = useState(true)
  const [message, setMessage] = useState("")
  const [saving, setSaving] = useState(false)
  const [restoring, setRestoring] = useState<Version | null>(null)
  const dir = project?.dir

  useEffect(() => {
    if (!dir) return
    let cancelled = false
    void (async () => {
      const ok = await commands.historyAvailable()
      if (cancelled) return
      setAvailable(ok)
      if (!ok) return setVersions([])
      try {
        const list = await call(commands.historyList(dir))
        if (!cancelled) setVersions(list)
      } catch (err) {
        if (!cancelled) setVersions([])
        toast.error(errorMessage(err))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [dir])

  if (!project) return null

  const save = async () => {
    const text = message.trim() || "Saved version"
    setSaving(true)
    try {
      // The project autosaves 300 ms after each change; write it now so the version is current.
      await call(commands.writeTextFile(joinPath(project.dir, PROJECT_FILE), serializeProject(project.doc)))
      const version = await call(commands.historySave(project.dir, text))
      if (!version) toast("Nothing changed since the last version")
      else {
        setVersions((v) => [version, ...(v ?? [])])
        setMessage("")
        toast.success("Version saved")
      }
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const restore = async (version: Version) => {
    try {
      const text = await call(commands.historyFile(project.dir, version.id, PROJECT_FILE))
      const { project: restored } = loadProject(text)
      project.documents.execute(restoreProject(restored, version.message))
      toast.success(`Restored "${version.message}". Ctrl+Z undoes it.`)
    } catch (err) {
      toast.error(`Couldn't restore that version: ${errorMessage(err)}`)
    } finally {
      setRestoring(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-[640px] px-6 pt-10 pb-24">
      <h1 className="text-xl font-medium tracking-[-0.01em] text-fg">History</h1>
      <p className="mt-1.5 text-base text-fg-muted">Save a version before a big change. You can always go back to it. Versions stay on this computer.</p>

      {!available ? (
        <div className="mt-6 rounded-lg bg-surface px-4 py-3 text-sm text-fg-muted">
          Versions are saved with git, which isn't installed. Get it from{" "}
          <button type="button" className="text-fg underline underline-offset-2" onClick={() => void openUrl("https://git-scm.com/downloads")}>
            git-scm.com
          </button>
          , then open this page again.
        </div>
      ) : (
        <form
          className="mt-6 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            void save()
          }}
        >
          <Input
            id="history-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={200}
            placeholder="What changed? (e.g. Added the berry bun)"
            aria-label="What changed"
            className="h-8"
          />
          <Button type="submit" size="sm" disabled={saving} className="shrink-0">
            <GitCommitVertical strokeWidth={1.75} /> {saving ? "Saving…" : "Save version"}
          </Button>
        </form>
      )}

      <div className="mt-6">
        {versions === null ? (
          <div className="grid place-items-center py-10">
            <PixelLoader className="size-5 text-brand" label="Loading versions" />
          </div>
        ) : versions.length === 0 ? (
          available && (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-fg-muted">
              <HistoryIcon className="size-5 text-fg-faint" strokeWidth={1.75} />
              No versions yet. Your first one saves the project as it is now.
            </div>
          )
        ) : (
          <ol className="relative flex flex-col">
            {/* The timeline line behind the dots. */}
            <span aria-hidden className="absolute top-3 bottom-3 left-[7px] w-px bg-line-subtle" />
            {versions.map((v, i) => (
              <BlurFade key={v.id} delay={Math.min(i, 8) * 0.03} direction="up" offset={4}>
                <li className="group relative flex items-center gap-3 rounded-lg py-2 pr-1 pl-0">
                  <span aria-hidden className={`relative z-10 size-[15px] shrink-0 rounded-full border-2 border-bg ${i === 0 ? "bg-brand" : "bg-line"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base text-fg" title={v.message}>
                      {v.message}
                    </p>
                    <p className="text-xs text-fg-muted">
                      {when(v.date)} · {v.files_changed} file{v.files_changed === 1 ? "" : "s"} changed · <span className="font-mono">{v.short}</span>
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-fg-muted opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100" onClick={() => setRestoring(v)}>
                    <RotateCcw strokeWidth={1.75} /> Restore
                  </Button>
                </li>
              </BlurFade>
            ))}
          </ol>
        )}
      </div>

      <Dialog open={restoring !== null} onOpenChange={(open) => !open && setRestoring(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Restore this version?</DialogTitle>
            <DialogDescription>
              The project goes back to “{restoring?.message}”. Your current state isn't lost: Ctrl+Z brings it back, and you can save it as a version first.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" size="sm" />}>Cancel</DialogClose>
            <Button size="sm" onClick={() => restoring && void restore(restoring)}>
              Restore
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
