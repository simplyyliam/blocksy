// New project dialog, matching add-project.png.
// Left: where to start from. Right: name, location, loader, version, advanced, preview.
import { FolderOpen } from "lucide-react"
import { useEffect, useState } from "react"
import { open as pickFolder } from "@tauri-apps/plugin-dialog"
import { deriveModId, MOD_ID_PATTERN, PACKAGE_PATTERN } from "@blocksy/core"
import { Button, Choice, cn, Collapsible, Dialog, DialogClose, Field, Input, Select, Spinner, Tooltip } from "@blocksy/ui"
import { registries, upcomingLoaders } from "../../app/modules"
import { errorMessage } from "../../shared/api"
import { buildMod } from "../../shared/project-actions"
import { expandHome, joinPath, prettyPath } from "../../shared/paths"
import { useJava } from "../../shared/stores/java"
import { useNavigation } from "../../shared/stores/navigation"
import { useProject } from "../../shared/stores/project"
import { useSettings } from "../../shared/stores/settings"
import { createAndOpen, previewTree } from "./create-project"

/** Left column rows. Only "Empty mod" exists in v0.1; the rest say when they arrive. */
const startFrom = [
  { id: "clone", label: "Clone from GitHub", note: "Arrives in v0.7 with GitHub sign-in" },
  { id: "import", label: "Import existing", note: "Opens a folder that has a blocksy.json" },
]
const projectTypes = [
  { id: "empty", label: "Empty mod" },
  { id: "item", label: "First item", note: "Arrives in v0.3" },
  { id: "block", label: "First block", note: "Arrives in v0.2" },
]

function SideRow({ label, active, note, onClick }: { label: string; active?: boolean; note?: string; onClick?: () => void }) {
  const row = (
    <button
      type="button"
      onClick={onClick}
      aria-disabled={!onClick}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex h-8 w-full items-center rounded-full px-3 text-left text-base outline-none transition-colors duration-150",
        "focus-visible:shadow-[0_0_0_3px_var(--b-focus)]",
        active ? "bg-surface-hover text-fg" : onClick ? "text-fg hover:bg-surface" : "text-fg-faint",
      )}
    >
      {label}
    </button>
  )
  return note ? <Tooltip label={note}>{row}</Tooltip> : row
}

export function NewProjectDialog() {
  const open = useNavigation((s) => s.newProjectOpen)
  const setOpen = useNavigation((s) => s.setNewProject)
  const { projectsDir, defaultProjectsDir, home } = useSettings()
  // The first registered loader target is the default (core never names loaders).
  const target = registries.loaderTargets.list()[0]!

  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [minecraftVersion, setMinecraftVersion] = useState(target.versions[0]!.minecraft)
  const [modIdOverride, setModIdOverride] = useState("")
  const [group, setGroup] = useState("com.example")
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  // Fresh form each time the dialog opens.
  useEffect(() => {
    if (!open) return
    setName("")
    setLocation(projectsDir ?? defaultProjectsDir ?? "")
    setModIdOverride("")
    setError(null)
  }, [open, projectsDir, defaultProjectsDir])

  const modId = modIdOverride || deriveModId(name || "my_first_mod")
  const input = { name: name || "My First Mod", target: target.id, minecraftVersion, modId, group }
  const tree = previewTree(input) // cheap: templates are plain strings

  const problems = {
    name: name.trim() ? null : "Give your mod a name",
    modId: MOD_ID_PATTERN.test(modId) ? null : "Lowercase letters, digits and _ only",
    group: PACKAGE_PATTERN.test(group) ? null : "A Java package like com.example",
  }
  const valid = !problems.name && !problems.modId && !problems.group && location.trim() !== ""

  const browse = async () => {
    const picked = await pickFolder({ directory: true, defaultPath: location || undefined, title: "Choose a location" })
    if (typeof picked === "string") setLocation(picked)
  }

  const importExisting = async () => {
    const picked = await pickFolder({ directory: true, title: "Open a Blocksy project" })
    if (typeof picked !== "string") return
    try {
      await useProject.getState().open(picked)
      setOpen(false)
    } catch {
      setError("That folder has no blocksy.json. Importing other mods arrives in a later release.")
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid || creating) return
    setCreating(true)
    setError(null)
    try {
      await createAndOpen({ ...input, name: name.trim(), location })
      setOpen(false)
      // Start the first build right away: it downloads Minecraft, which takes a while.
      if (useJava.getState().active) void buildMod()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen} title="New project" className="w-[848px]">
      <form onSubmit={submit} className="flex max-h-[calc(100vh-48px)] flex-col pt-6 pr-[17px] pb-5 pl-[22px]">
        <h2 className="pl-px text-lg font-medium text-fg">New project</h2>

        <div className="mt-[23px] grid min-h-0 grid-cols-[186px_1fr] gap-x-[25px] overflow-y-auto">
          {/* Left column */}
          <div className="flex flex-col">
            <p className="h-[19px] pl-px text-base text-fg-muted">Start from existing</p>
            <div className="mt-[12px] flex flex-col gap-0.5">
              <SideRow label={startFrom[0]!.label} note={startFrom[0]!.note} />
              <SideRow label={startFrom[1]!.label} note={startFrom[1]!.note} onClick={() => void importExisting()} />
            </div>
            <p className="mt-[29px] h-[19px] pl-px text-base text-fg-muted">Project type</p>
            <div className="mt-[12px] flex flex-col gap-0.5">
              {projectTypes.map((t) => (
                <SideRow key={t.id} label={t.label} note={t.note} active={t.id === "empty"} onClick={t.id === "empty" ? () => {} : undefined} />
              ))}
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-[28px]">
            <Field label="Name" error={name && problems.name ? problems.name : undefined}>
              {(id) => (
                <Input id={id} autoFocus value={name} placeholder="Aetheric Storage Engineering" onChange={(e) => setName(e.target.value)} />
              )}
            </Field>

            <Field label="Location" hint={`Creates ${prettyPath(joinPath(location || "~", modId), home)}`}>
              {(id) => (
                <div className="relative">
                  <Input id={id} value={prettyPath(location, home)} onChange={(e) => setLocation(expandHome(e.target.value, home))} className="pr-11" />
                  <Tooltip label="Choose folder">
                    <button
                      type="button"
                      onClick={() => void browse()}
                      aria-label="Choose folder"
                      className="absolute top-1/2 right-1.5 grid size-7 -translate-y-1/2 place-items-center rounded-full text-fg-muted outline-none transition-colors hover:bg-surface-hover hover:text-fg focus-visible:shadow-[0_0_0_3px_var(--b-focus)]"
                    >
                      <FolderOpen className="size-3.5" strokeWidth={1.75} />
                    </button>
                  </Tooltip>
                </div>
              )}
            </Field>

            <Field label="Loader">
              {() => (
                <Choice
                  aria-label="Loader"
                  value={target.id}
                  onChange={() => {}}
                  options={[
                    ...registries.loaderTargets.list().map((t) => ({ value: t.id, label: t.name })),
                    ...upcomingLoaders.map((l) => ({ value: l.id, label: l.name, disabled: true, note: l.note })),
                  ]}
                />
              )}
            </Field>

            <Field label="Version">
              {(id) => (
                <Select
                  id={id}
                  value={minecraftVersion}
                  onChange={setMinecraftVersion}
                  options={target.versions.map((v) => ({ value: v.minecraft, label: v.minecraft }))}
                  className="h-[38px] w-[158px]"
                />
              )}
            </Field>

            <Collapsible label="Advanced">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Mod ID" error={problems.modId ?? undefined}>
                  {(id) => <Input id={id} value={modId} onChange={(e) => setModIdOverride(e.target.value)} />}
                </Field>
                <Field label="Java package" error={problems.group ?? undefined}>
                  {(id) => <Input id={id} value={group} onChange={(e) => setGroup(e.target.value)} />}
                </Field>
              </div>
            </Collapsible>

            <Field label="What gets created">
              {() => (
                <pre
                  data-selectable
                  className="h-[175px] max-w-[570px] overflow-auto rounded-lg px-4 py-3.5 font-mono text-sm leading-[15px] text-fg shadow-[inset_0_0_0_1px_var(--b-line)]"
                >
                  {tree ?? "Fill in the fields above to see the files."}
                </pre>
              )}
            </Field>
          </div>
        </div>

        <div className="mt-[30px] flex shrink-0 items-center justify-between gap-4">
          <p className="min-h-5 text-base text-danger" role="alert">
            {error}
          </p>
          <div className="flex gap-2">
            <DialogClose render={<Button variant="quiet" size="md" type="button" />}>Cancel</DialogClose>
            <Button variant="primary" size="md" type="submit" disabled={!valid || creating} className="px-4">
              {creating && <Spinner />}
              Create
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  )
}
