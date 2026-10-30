// Settings dialog, laid out like Claude's settings: a list of sections on the left,
// the chosen section on the right as rows (label + description, control on the right).
// Built from shadcn's "sidebar in a dialog" pattern.
//
//   ┌──────────────┬────────────────────────────────────┐
//   │ Settings     │ General                          × │
//   │ ▸ General    │ Theme ─────────────────── [Modern] │
//   │   Java       │ ────────────────────────────────── │
//   │   Projects   │ ...                                │
//   │   Updates    │                                    │
//   └──────────────┴────────────────────────────────────┘
import { Coffee, FolderOpen, Folders, RefreshCw, Settings2, type LucideIcon } from "lucide-react"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { getVersion } from "@tauri-apps/api/app"
import { open as pickFolder } from "@tauri-apps/plugin-dialog"
import {
  applyTheme, Button, cn, Dialog, DialogContent, DialogTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Separator, Sidebar, SidebarContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, Spinner,
} from "@blocksy/ui"
import { registries } from "../../app/modules"
import { errorMessage } from "../../shared/api"
import { prettyPath } from "../../shared/paths"
import { useJava } from "../../shared/stores/java"
import { useNavigation } from "../../shared/stores/navigation"
import { useSettings } from "../../shared/stores/settings"
import { useUpdates } from "../../shared/stores/updates"

// Each section has a coloured icon tile (theme colours, like macOS System Settings),
// so the list is quick to scan.
const sections = [
  { id: "general", label: "General", Icon: Settings2 as LucideIcon, tile: "bg-fg-muted" },
  { id: "java", label: "Java", Icon: Coffee as LucideIcon, tile: "bg-warning" },
  { id: "projects", label: "Projects", Icon: Folders as LucideIcon, tile: "bg-brand" },
  { id: "updates", label: "Updates", Icon: RefreshCw as LucideIcon, tile: "bg-success" },
] as const
type SectionId = (typeof sections)[number]["id"]

const AUTO = "__auto__"

/** One setting: what it is on the left, its control on the right. */
function Row({ label, description, children }: { label: string; description?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-8 px-4 py-2.5">
      <div className="min-w-0">
        <p className="text-sm text-fg">{label}</p>
        {description && <p className="mt-0.5 text-xs wrap-anywhere text-fg-muted">{description}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">{children}</div>
    </div>
  )
}

/** A group of rows on a soft rounded surface, hairlines between them (macOS-style). */
function Rows({ children }: { children: ReactNode[] }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl bg-subtle">
      {children.filter(Boolean).map((row, i) => (
        <div key={i}>
          {i > 0 && <Separator className="mx-4 w-auto! bg-line-subtle" />}
          {row}
        </div>
      ))}
    </div>
  )
}

/** A grey shadcn Select sized like the other row controls. */
function SettingSelect({ value, onChange, items, className }: {
  value: string
  onChange(value: string): void
  items: { value: string; label: string }[]
  className?: string
}) {
  return (
    <Select items={items} value={value} onValueChange={(next) => next !== null && onChange(next)}>
      <SelectTrigger className={cn("h-8! rounded-md bg-secondary", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} align="end">
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function GeneralSection() {
  const settings = useSettings()
  const chooseTheme = async (id: string) => {
    const theme = registries.themes.get(id)
    if (theme) applyTheme(theme)
    await settings.update({ theme: id })
  }
  return (
    <Rows>
      {[
        <Row key="theme" label="Theme" description="The Minecraft theme arrives in v0.2">
          <SettingSelect
            value={settings.theme}
            onChange={(v) => void chooseTheme(v)}
            className="min-w-[140px]"
            items={registries.themes.list().map((t) => ({ value: t.id, label: t.name }))}
          />
        </Row>,
      ]}
    </Rows>
  )
}

function JavaSection() {
  const settings = useSettings()
  const java = useJava()
  const usableJava = java.installs.filter((j) => j.is_jdk && j.major >= java.required)
  const chooseJava = async (home: string) => {
    const javaHome = home === AUTO ? null : home
    await settings.update({ javaHome })
    await java.detect(javaHome, java.required)
  }
  return (
    <Rows>
      {[
        <Row key="jdk" label="JDK" description={java.active ? java.active.home : `Needs Java ${java.required} or newer`}>
          <SettingSelect
            value={settings.javaHome ?? AUTO}
            onChange={(v) => void chooseJava(v)}
            className="min-w-[200px]"
            items={[
              { value: AUTO, label: "Automatic (newest found)" },
              ...usableJava.map((j) => ({ value: j.home, label: `Java ${j.version} · ${j.vendor}` })),
            ]}
          />
        </Row>,
      ]}
    </Rows>
  )
}

function ProjectsSection() {
  const settings = useSettings()
  const chooseFolder = async () => {
    const picked = await pickFolder({ directory: true, title: "Default project folder" })
    if (typeof picked === "string") await settings.update({ projectsDir: picked })
  }
  return (
    <Rows>
      {[
        <Row
          key="folder"
          label="Default folder"
          description={prettyPath(settings.projectsDir ?? settings.defaultProjectsDir ?? "", settings.home)}
        >
          {settings.projectsDir && (
            <Button variant="ghost" onClick={() => void settings.update({ projectsDir: null })}>
              Reset
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => void chooseFolder()}>
            <FolderOpen strokeWidth={1.75} /> Change…
          </Button>
        </Row>,
      ]}
    </Rows>
  )
}

function UpdatesSection() {
  const updates = useUpdates()
  const setWhatsNew = useNavigation((s) => s.setWhatsNew)
  const [appVersion, setAppVersion] = useState("")
  const [checking, setChecking] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  useEffect(() => {
    void getVersion().then(setAppVersion).catch(() => {})
  }, [])

  const checkNow = async () => {
    setChecking(true)
    setNote(null)
    try {
      const version = await updates.checkNow()
      setNote(version ? `Blocksy ${version} is downloading` : "You're up to date")
    } catch (err) {
      setNote(errorMessage(err))
    } finally {
      setChecking(false)
    }
  }

  const description =
    note ??
    (updates.state === "disabled"
      ? "Automatic updates are off in this build"
      : updates.state === "ready"
        ? `Blocksy ${updates.version} is ready. Restart from the status bar.`
        : "Checks on start and every few hours")

  return (
    <Rows>
      {[
        <Row key="version" label={appVersion ? `Blocksy ${appVersion}` : "Blocksy"} description={description}>
          <Button variant="secondary" size="sm" onClick={() => void checkNow()} disabled={checking || updates.state === "disabled"}>
            {checking && <Spinner />} Check for updates
          </Button>
        </Row>,
        <Row key="whats-new" label="What's new" description="The changes in this version of Blocksy">
          <Button variant="secondary" size="sm" onClick={() => setWhatsNew(true)}>
            Show
          </Button>
        </Row>,
      ]}
    </Rows>
  )
}

const bodies: Record<SectionId, () => ReactNode> = {
  general: GeneralSection,
  java: JavaSection,
  projects: ProjectsSection,
  updates: UpdatesSection,
}

export function SettingsDialog() {
  const open = useNavigation((s) => s.settingsOpen)
  const setOpen = useNavigation((s) => s.setSettings)
  const [section, setSection] = useState<SectionId>("general")
  const Body = bodies[section]
  const title = sections.find((s) => s.id === section)!.label
  // Focus the content pane on open, so no focus ring flashes on the first nav row.
  const paneRef = useRef<HTMLElement>(null)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent initialFocus={paneRef} className="h-[520px] max-h-[calc(100vh-48px)] w-[760px] max-w-[calc(100vw-48px)] gap-0 overflow-hidden rounded-dialog p-0 sm:max-w-[calc(100vw-48px)]">
        <SidebarProvider className="h-full min-h-0 items-stretch">
          {/* Left: the sections. collapsible="none" keeps it a plain column inside the dialog. */}
          <Sidebar collapsible="none" className="w-[200px] bg-subtle">
            <SidebarContent className="gap-0 px-3 pt-5">
              <DialogTitle className="mb-3 px-2.5 text-lg leading-normal text-fg">Settings</DialogTitle>
              <SidebarMenu className="gap-0.5">
                {sections.map((s) => (
                  <SidebarMenuItem key={s.id}>
                    <SidebarMenuButton isActive={s.id === section} onClick={() => setSection(s.id)} className="h-8 data-active:bg-surface-hover">
                      <span className={`grid size-5 shrink-0 place-items-center rounded-[5px] text-white ${s.tile}`}>
                        <s.Icon className="size-3!" strokeWidth={2.25} />
                      </span>
                      <span>{s.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>

          {/* Right: the chosen section. key replays the soft fade when switching. */}
          <section key={section} ref={paneRef} tabIndex={-1} className="page-enter outline-none min-w-0 flex-1 overflow-y-auto px-8 pt-5 pb-8">
            <h2 className="flex h-[27px] items-center text-lg text-fg">{title}</h2>
            <div className="mt-4" />
            <Body />
          </section>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}
