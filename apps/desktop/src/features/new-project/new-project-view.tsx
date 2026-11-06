// New project, JetBrains-style (and like MCreator's "Create new workspace"): a list of project types
// on the left, the form on the right. It fills the welcome window (a dialog inside a fixed 820 x 600
// window would be cramped); Esc or Cancel goes back to Projects.
//
//   ┌ JAVA EDITION MOD ┬ Name         [ Berry Mod            ] ✓          ┐
//   │ ▣ Fabric         │ Mod ID       [ berry_mod            ] ✓  ↺       │
//   │ ▢ NeoForge  Later│ Java package [ com.example ] .berry_mod ✓          │
//   │ ▢ Forge     Later│ Location     [ ~/Blocksy            ] [📂]       │
//   │ ▢ Quilt     Later│ Minecraft    [ 26.1.2          v ]                │
//   │                  │ JDK          [ Java 25 · Temurin v ] Add… Download│
//   │                  │ Template     [Empty][Example block][Example item] │
//   │                  │ [x] Create a Git repository                       │
//   │                  │ › Advanced (what gets created)                    │
//   └──────────────────┴────────────────────────── [Cancel] [Create] ──────┘
// Create writes the files, then asks Rust to open the editor with the workspace setup (v0.4) running.
import { Check, ChevronRight, FolderOpen, Info, RotateCcw, type LucideIcon } from "lucide-react"
import { useEffect, useId, useState, type ReactNode } from "react"
import { open as pickFolder } from "@tauri-apps/plugin-dialog"
import { openUrl } from "@tauri-apps/plugin-opener"
import {
  Badge, Button, Checkbox, cn, Collapsible, CollapsibleContent, CollapsibleTrigger, FieldDescription, FieldError, FieldLabel, InputGroup,
  InputGroupAddon, InputGroupButton, InputGroupInput, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Spinner, toast,
  ToggleGroup, ToggleGroupItem, Tooltip, TooltipContent, TooltipTrigger,
} from "@blocksy/ui"
import { registries, upcomingLoaders } from "../../app/modules"
import { requiredJava } from "../../app/boot"
import { call, errorMessage } from "../../shared/api"
import { commands } from "../../shared/bindings"
import { expandHome, joinPath, prettyPath } from "../../shared/paths"
import { useJava } from "../../shared/stores/java"
import { useSettings } from "../../shared/stores/settings"
import { useWelcome } from "../../shared/stores/welcome"
import { openEditor } from "../../shared/windows"
import { previewTree, writeNewProject } from "./create-project"
import type { StarterId } from "./starters"
import { javaPackage, modIdFromName, validateNewProject, type FieldProblems } from "./validate"

const ADOPTIUM = "https://adoptium.net/temurin/releases/"
const AUTO = "__auto__"

const templates: { id: StarterId; label: string; about: string }[] = [
  { id: "empty", label: "Empty mod", about: "Just the mod, ready for your first element." },
  { id: "block", label: "Example block", about: "A creative tab with one block, so Run shows something in game straight away." },
  { id: "item", label: "Example item", about: "Berry Dough and a Berry Bun with recipes: craft it, cook it, eat it." },
]

/** A form row: label on the left, the control (and its message) on the right. */
function Row({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[116px_1fr] items-start gap-x-4">
      <FieldLabel htmlFor={htmlFor} className="h-8 items-center text-sm text-fg">
        {label}
      </FieldLabel>
      <div className="flex min-w-0 flex-col gap-1">{children}</div>
    </div>
  )
}

/** A text field with a green check when its value is fine (like MCreator's ✓ per field). */
function CheckedInput({ valid, trailing, ...props }: React.ComponentProps<typeof InputGroupInput> & { valid: boolean; trailing?: ReactNode }) {
  return (
    <InputGroup className="h-8">
      <InputGroupInput spellCheck={false} autoComplete="off" {...props} />
      <InputGroupAddon align="inline-end">
        {trailing}
        {valid && <Check className="size-3.5 text-success" strokeWidth={2.25} aria-hidden />}
      </InputGroupAddon>
    </InputGroup>
  )
}

function TypeRow({ Icon, label, active, note }: { Icon: LucideIcon; label: string; active?: boolean; note?: string }) {
  const row = (
    <div
      role="option"
      aria-selected={!!active}
      aria-disabled={!active}
      tabIndex={active ? 0 : -1}
      className={cn("flex h-7 items-center gap-2.5 rounded-md px-2 text-sm outline-none", active ? "bg-surface-hover text-fg" : "text-fg-faint")}
    >
      <Icon className="size-4" strokeWidth={1.75} />
      <span className="flex-1 truncate">{label}</span>
      {!active && <Badge variant="secondary" className="h-4 px-1.5 text-[10px] font-normal text-fg-muted">Later</Badge>}
    </div>
  )
  if (!note) return row
  return (
    <Tooltip>
      <TooltipTrigger render={row} />
      <TooltipContent side="right">{note}</TooltipContent>
    </Tooltip>
  )
}

export function NewProjectView() {
  const setCreating = useWelcome((s) => s.setCreating)
  const settings = useSettings()
  const java = useJava()
  // The first registered loader target is the default (core never names loaders).
  const target = registries.loaderTargets.list()[0]!
  const ids = { name: useId(), modId: useId(), group: useId(), location: useId(), version: useId(), jdk: useId() }

  const [name, setName] = useState("")
  const [nameTouched, setNameTouched] = useState(false)
  const [modIdOverride, setModIdOverride] = useState<string | null>(null)
  const [group, setGroup] = useState("com.example")
  const [location, setLocation] = useState(settings.projectsDir ?? settings.defaultProjectsDir ?? "")
  const [minecraftVersion, setMinecraftVersion] = useState(target.versions[0]!.minecraft)
  const [template, setTemplate] = useState<StarterId>("block")
  const [git, setGit] = useState(true)
  const [gitAvailable, setGitAvailable] = useState(true)
  const [folderExists, setFolderExists] = useState<boolean | null>(null)
  const [creating, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const modId = modIdOverride ?? modIdFromName(name)
  const version = target.versions.find((v) => v.minecraft === minecraftVersion) ?? target.versions[0]!
  const problems: FieldProblems = validateNewProject({ name, modId, group, location, folderExists })
  const valid = Object.keys(problems).length === 0

  // The location can arrive after the settings load.
  useEffect(() => {
    setLocation((current) => current || (settings.projectsDir ?? settings.defaultProjectsDir ?? ""))
  }, [settings.projectsDir, settings.defaultProjectsDir])

  // Is Git installed? If not, the checkbox is off and says why.
  useEffect(() => {
    void commands.historyAvailable().then((ok) => {
      setGitAvailable(ok)
      if (!ok) setGit(false)
    })
  }, [])

  // Does the folder already exist? Looked up shortly after typing stops.
  useEffect(() => {
    if (!location.trim() || !modId) return setFolderExists(null)
    const timer = setTimeout(() => void commands.pathExists(joinPath(location, modId)).then(setFolderExists), 250)
    return () => clearTimeout(timer)
  }, [location, modId])

  const input = { name: name.trim() || "My First Mod", target: target.id, minecraftVersion, modId: modId || "my_first_mod", group }
  const tree = previewTree(input, template) // cheap: templates are plain strings

  const usableJava = java.installs.filter((j) => j.is_jdk && j.major >= version.java)
  const chosenJava = settings.javaHome ?? AUTO

  const chooseJava = async (home: string) => {
    const javaHome = home === AUTO ? null : home
    await settings.update({ javaHome })
    await useJava.getState().detect(javaHome, requiredJava())
  }
  const addJavaFromDisk = async () => {
    const picked = await pickFolder({ directory: true, title: `Pick a JDK folder (Java ${version.java} or newer)` })
    if (typeof picked !== "string") return
    await settings.update({ javaHome: picked })
    await useJava.getState().detect(picked, requiredJava())
    if (!useJava.getState().active) toast.error(`That folder isn't a JDK ${version.java} or newer. Pick the folder that has bin/javac inside.`)
  }
  const browse = async () => {
    const picked = await pickFolder({ directory: true, defaultPath: location || undefined, title: "Choose a location" })
    if (typeof picked === "string") setLocation(picked)
  }

  const cancel = () => setCreating(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid || creating) return
    setBusy(true)
    setError(null)
    try {
      const dir = await writeNewProject({ ...input, name: name.trim(), location }, template)
      if (git && gitAvailable) {
        // A project without Git is still a project: say so and carry on.
        await call(commands.historySave(dir, "Create project")).catch((err) => toast.error(`Created, but couldn't start Git: ${errorMessage(err)}`))
      }
      // The editor opens the project and starts the workspace setup (the first Gradle setup downloads
      // Minecraft); this window closes. Quiet when there is no JDK yet.
      await openEditor(dir, true)
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  const firstProblem = problems.name ?? problems.modId ?? problems.group ?? problems.location
  const nameError = nameTouched ? problems.name : undefined

  return (
    <form
      onSubmit={submit}
      onKeyDown={(e) => e.key === "Escape" && !e.defaultPrevented && !creating && cancel()}
      className="flex h-full min-h-0 flex-col"
    >
      <div className="flex min-h-0 flex-1">
        {/* Left: project types. Fabric is the one that exists; the others are shown as later. */}
        <nav aria-label="Project type" className="w-[184px] shrink-0 bg-subtle px-2 pt-3">
          <p className="px-2 pb-1.5 text-xs text-fg-muted">Java Edition mod</p>
          <div role="listbox" aria-label="Project type" className="flex flex-col gap-0.5">
            <TypeRow Icon={FolderOpen} label={`${target.name} mod`} active />
            {upcomingLoaders.map((l) => (
              <TypeRow key={l.id} Icon={FolderOpen} label={l.name} note={l.note} />
            ))}
          </div>
        </nav>

        {/* Right: the form. */}
        <div className="min-w-0 flex-1 overflow-y-auto px-6 pt-4 pb-3">
          <h1 className="mb-4 text-lg leading-normal text-fg">New {target.name} mod</h1>
          <div className="flex flex-col gap-3">
            <Row label="Name" htmlFor={ids.name}>
              <CheckedInput
                id={ids.name}
                autoFocus
                valid={!problems.name}
                aria-invalid={nameError ? true : undefined}
                placeholder="Aetheric Storage Engineering"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setNameTouched(true)}
              />
              {nameError ? <FieldError>{nameError}</FieldError> : <FieldDescription>Shown in game and in the mod list</FieldDescription>}
            </Row>

            <Row label="Mod ID" htmlFor={ids.modId}>
              <CheckedInput
                id={ids.modId}
                valid={!problems.modId}
                aria-invalid={problems.modId && modId ? true : undefined}
                placeholder="made_from_the_name"
                value={modId}
                onChange={(e) => setModIdOverride(e.target.value)}
                trailing={
                  modIdOverride !== null && (
                    <InputGroupButton size="icon-xs" aria-label="Make it from the name again" title="Make it from the name again" onClick={() => setModIdOverride(null)}>
                      <RotateCcw strokeWidth={1.75} />
                    </InputGroupButton>
                  )
                }
              />
              {problems.modId && modId ? <FieldError>{problems.modId}</FieldError> : <FieldDescription>Names your files and ids in game, like {modId || "berry_mod"}:ruby_block</FieldDescription>}
            </Row>

            <Row label="Java package" htmlFor={ids.group}>
              <CheckedInput
                id={ids.group}
                valid={!problems.group}
                aria-invalid={problems.group ? true : undefined}
                value={group}
                onChange={(e) => setGroup(e.target.value)}
              />
              {problems.group ? <FieldError>{problems.group}</FieldError> : <FieldDescription className="wrap-anywhere">Your code goes in {javaPackage(group, modId)}</FieldDescription>}
            </Row>

            <Row label="Location" htmlFor={ids.location}>
              <CheckedInput
                id={ids.location}
                valid={!problems.location}
                aria-invalid={problems.location ? true : undefined}
                value={prettyPath(location, settings.home)}
                onChange={(e) => setLocation(expandHome(e.target.value, settings.home))}
                trailing={
                  <InputGroupButton size="icon-xs" aria-label="Choose folder" title="Choose folder" onClick={() => void browse()}>
                    <FolderOpen strokeWidth={1.75} />
                  </InputGroupButton>
                }
              />
              {problems.location ? (
                <FieldError>{problems.location}</FieldError>
              ) : (
                <FieldDescription className="wrap-anywhere">Creates {prettyPath(joinPath(location || "~", modId || "mod_id"), settings.home)}</FieldDescription>
              )}
            </Row>

            <Row label="Minecraft" htmlFor={ids.version}>
              <Select
                items={target.versions.map((v, i) => ({ value: v.minecraft, label: `${v.minecraft}${i === 0 ? " (recommended)" : ""}` }))}
                value={minecraftVersion}
                onValueChange={(next) => next !== null && setMinecraftVersion(next)}
              >
                <SelectTrigger id={ids.version} className="h-8! w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {target.versions.map((v, i) => (
                    <SelectItem key={v.minecraft} value={v.minecraft}>
                      {v.minecraft}{i === 0 ? " (recommended)" : ""} · needs Java {v.java}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>

            <Row label="JDK" htmlFor={ids.jdk}>
              <div className="flex flex-wrap items-center gap-1.5">
                <Select
                  items={[
                    { value: AUTO, label: "Automatic (newest found)" },
                    ...usableJava.map((j) => ({ value: j.home, label: `Java ${j.version} · ${j.vendor}` })),
                  ]}
                  value={chosenJava}
                  onValueChange={(next) => next !== null && void chooseJava(next)}
                >
                  <SelectTrigger id={ids.jdk} className="h-8! w-[220px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    <SelectItem value={AUTO}>Automatic (newest found)</SelectItem>
                    {usableJava.map((j) => (
                      <SelectItem key={j.home} value={j.home}>
                        Java {j.version} · {j.vendor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="ghost" size="sm" onClick={() => void addJavaFromDisk()}>
                  Add from disk…
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => void openUrl(ADOPTIUM)}>
                  Download
                </Button>
              </div>
              {java.status === "checking" ? (
                <FieldDescription>Looking for Java…</FieldDescription>
              ) : java.active && java.active.major >= version.java ? (
                <FieldDescription className="wrap-anywhere">Builds use Java {java.active.version} ({java.active.vendor}). Used for all projects.</FieldDescription>
              ) : (
                <FieldDescription className="text-warning">
                  No JDK {version.java} or newer found. You can create the project now; Build needs one (Download, or pick it from disk).
                </FieldDescription>
              )}
            </Row>

            <Row label="Template">
              <ToggleGroup aria-label="Template" value={[template]} onValueChange={(next) => next[0] && setTemplate(next[0] as StarterId)} className="self-start">
                {templates.map((t) => (
                  <ToggleGroupItem key={t.id} value={t.id} className="bg-input/50 px-3 aria-pressed:ring-1 aria-pressed:ring-border">
                    {t.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <FieldDescription>{templates.find((t) => t.id === template)!.about}</FieldDescription>
            </Row>

            <Row label="Version control">
              <label className="flex h-8 items-center gap-2 text-sm text-fg">
                <Checkbox checked={git && gitAvailable} disabled={!gitAvailable} onCheckedChange={(on) => setGit(on === true)} />
                Create a Git repository
              </label>
              <FieldDescription>{gitAvailable ? "Saves versions of your mod (History) from the start." : "Git isn't installed. Install it from git-scm.com to turn this on."}</FieldDescription>
            </Row>

            {/* "> Advanced": the chevron turns and the panel slides open. */}
            <Collapsible>
              <CollapsibleTrigger className="group flex h-7 items-center gap-2 rounded-md text-sm text-fg outline-none focus-visible:ring-3 focus-visible:ring-ring/30">
                <ChevronRight className="size-3.5 transition-transform duration-200 ease-out group-data-[panel-open]:rotate-90" strokeWidth={2} />
                Advanced
              </CollapsibleTrigger>
              <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height,opacity] duration-200 ease-out data-[starting-style]:h-0 data-[starting-style]:opacity-0 data-[ending-style]:h-0 data-[ending-style]:opacity-0">
                <p className="pt-2 pb-1.5 text-sm text-fg-muted">What gets created</p>
                <pre data-selectable className="h-[120px] overflow-auto rounded-lg px-4 py-3 font-mono text-xs leading-[15px] text-fg shadow-[inset_0_0_0_1px_var(--b-line)]">
                  {tree ?? "Fill in the fields above to see the files."}
                </pre>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-4 px-6 py-3">
        <p className={cn("flex min-w-0 flex-1 items-center gap-1.5 text-sm", error ? "text-danger" : "text-fg-muted")} role={error ? "alert" : undefined}>
          {error ?? (
            <>
              <Info className="size-3.5 shrink-0" strokeWidth={1.75} />
              <span className="truncate">
                {firstProblem ?? `${target.name} mods run on Minecraft Java Edition with the ${target.name} loader installed.`}
              </span>
            </>
          )}
        </p>
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="outline" size="sm" onClick={cancel} disabled={creating} className="border-line-subtle bg-subtle">
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={!valid || creating} className="px-4">
            {creating && <Spinner />}
            {creating ? "Creating…" : "Create"}
          </Button>
        </div>
      </div>
    </form>
  )
}
