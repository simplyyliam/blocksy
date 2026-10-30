// New project dialog, matching add-project.png.
// Left: where to start from. Right: name, location, loader, version, advanced, preview.
import { ChevronRight, FolderOpen } from "lucide-react"
import { useEffect, useId, useState } from "react"
import { open as pickFolder } from "@tauri-apps/plugin-dialog"
import { deriveModId, MOD_ID_PATTERN, PACKAGE_PATTERN } from "@blocksy/core"
import {
  Button, cn, Collapsible, CollapsibleContent, CollapsibleTrigger, Dialog, DialogClose, DialogContent, DialogTitle,
  Field, FieldDescription, FieldError, FieldLabel, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Spinner, ToggleGroup, ToggleGroupItem, Tooltip, TooltipContent, TooltipTrigger,
} from "@blocksy/ui"
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
    <Button
      variant="ghost"
      size="sm"
      type="button"
      onClick={onClick}
      aria-disabled={!onClick}
      aria-current={active ? "true" : undefined}
      className={cn(
        "w-full justify-start rounded-full px-3",
        active && "bg-surface-hover hover:bg-surface-hover",
        !onClick && "hover:bg-transparent",
      )}
    >
      {label}
    </Button>
  )
  if (!note) return row
  // Rows that arrive later explain when, on hover.
  return (
    <Tooltip>
      <TooltipTrigger render={row} />
      <TooltipContent>{note}</TooltipContent>
    </Tooltip>
  )
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
  const ids = { name: useId(), location: useId(), version: useId(), modId: useId(), group: useId() }

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

  const nameError = name && problems.name ? problems.name : null
  // Pill fields from add-project.png: 38px tall and 158px wide.
  const pillField = "h-[38px] w-[158px] rounded-full bg-input px-4"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showCloseButton={false} className="w-[848px] max-w-[calc(100vw-48px)] gap-0 bg-bg p-0 sm:max-w-[calc(100vw-48px)]">
        <form onSubmit={submit} className="flex max-h-[calc(100vh-48px)] flex-col pt-6 pr-[17px] pb-5 pl-[22px]">
          <DialogTitle className="pl-px text-lg leading-normal text-fg">New project</DialogTitle>

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
              <Field>
                <FieldLabel htmlFor={ids.name}>Name</FieldLabel>
                <Input
                  id={ids.name}
                  autoFocus
                  spellCheck={false}
                  aria-invalid={nameError ? true : undefined}
                  value={name}
                  placeholder="Aetheric Storage Engineering"
                  onChange={(e) => setName(e.target.value)}
                />
                {nameError && <FieldError>{nameError}</FieldError>}
              </Field>

              <Field>
                <FieldLabel htmlFor={ids.location}>Location</FieldLabel>
                <div className="relative">
                  <Input
                    id={ids.location}
                    spellCheck={false}
                    value={prettyPath(location, home)}
                    onChange={(e) => setLocation(expandHome(e.target.value, home))}
                    className="pr-11"
                  />
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          aria-label="Choose folder"
                          onClick={() => void browse()}
                          className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-full text-muted-foreground hover:bg-surface-hover"
                        />
                      }
                    >
                      <FolderOpen strokeWidth={1.75} />
                    </TooltipTrigger>
                    <TooltipContent>Choose folder</TooltipContent>
                  </Tooltip>
                </div>
                <FieldDescription>Creates {prettyPath(joinPath(location || "~", modId), home)}</FieldDescription>
              </Field>

              <Field>
                <FieldLabel>Loader</FieldLabel>
                <ToggleGroup aria-label="Loader" value={[target.id]} onValueChange={() => {}}>
                  {registries.loaderTargets.list().map((t) => (
                    <ToggleGroupItem
                      key={t.id}
                      value={t.id}
                      className={cn(pillField, "justify-start aria-pressed:bg-input aria-pressed:ring-1 aria-pressed:ring-border")}
                    >
                      {t.name}
                    </ToggleGroupItem>
                  ))}
                  {/* Loaders that arrive later: greyed out, with a tooltip saying when. */}
                  {upcomingLoaders.map((l) => (
                    <Tooltip key={l.id}>
                      <TooltipTrigger
                        render={
                          <ToggleGroupItem
                            value={l.id}
                            disabled
                            className={cn(pillField, "pointer-events-auto justify-start disabled:opacity-100")}
                          />
                        }
                      >
                        {l.name}
                      </TooltipTrigger>
                      <TooltipContent>{l.note}</TooltipContent>
                    </Tooltip>
                  ))}
                </ToggleGroup>
              </Field>

              <Field>
                <FieldLabel htmlFor={ids.version}>Version</FieldLabel>
                <Select
                  items={target.versions.map((v) => ({ value: v.minecraft, label: v.minecraft }))}
                  value={minecraftVersion}
                  onValueChange={(next) => next !== null && setMinecraftVersion(next)}
                >
                  <SelectTrigger id={ids.version} className={cn(pillField, "h-[38px]! w-[158px]!")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {target.versions.map((v) => (
                      <SelectItem key={v.minecraft} value={v.minecraft}>
                        {v.minecraft}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {/* "> Advanced": the chevron turns and the panel slides open. */}
              <Collapsible>
                <CollapsibleTrigger className="group flex h-7 items-center gap-2 rounded-md text-base text-fg outline-none focus-visible:ring-3 focus-visible:ring-ring/30">
                  <ChevronRight
                    className="size-3.5 transition-transform duration-200 ease-out group-data-[panel-open]:rotate-90"
                    strokeWidth={2}
                  />
                  Advanced
                </CollapsibleTrigger>
                <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height,opacity] duration-200 ease-out data-[starting-style]:h-0 data-[starting-style]:opacity-0 data-[ending-style]:h-0 data-[ending-style]:opacity-0">
                  <div className="grid grid-cols-2 gap-3 pt-3">
                    <Field>
                      <FieldLabel htmlFor={ids.modId}>Mod ID</FieldLabel>
                      <Input
                        id={ids.modId}
                        spellCheck={false}
                        aria-invalid={problems.modId ? true : undefined}
                        value={modId}
                        onChange={(e) => setModIdOverride(e.target.value)}
                      />
                      {problems.modId && <FieldError>{problems.modId}</FieldError>}
                    </Field>
                    <Field>
                      <FieldLabel htmlFor={ids.group}>Java package</FieldLabel>
                      <Input
                        id={ids.group}
                        spellCheck={false}
                        aria-invalid={problems.group ? true : undefined}
                        value={group}
                        onChange={(e) => setGroup(e.target.value)}
                      />
                      {problems.group && <FieldError>{problems.group}</FieldError>}
                    </Field>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Field>
                <FieldLabel>What gets created</FieldLabel>
                <pre
                  data-selectable
                  className="h-[175px] max-w-[570px] overflow-auto rounded-lg px-4 py-3.5 font-mono text-sm leading-[15px] text-fg shadow-[inset_0_0_0_1px_var(--b-line)]"
                >
                  {tree ?? "Fill in the fields above to see the files."}
                </pre>
              </Field>
            </div>
          </div>

          <div className="mt-[30px] flex shrink-0 items-center justify-between gap-4">
            <p className="min-h-5 text-base text-danger" role="alert">
              {error}
            </p>
            <div className="flex gap-2">
              <DialogClose render={<Button variant="outline" size="lg" type="button" className="border-line-subtle bg-subtle" />}>Cancel</DialogClose>
              <Button variant="default" size="lg" type="submit" disabled={!valid || creating} className="px-4">
                {creating && <Spinner />}
                Create
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
