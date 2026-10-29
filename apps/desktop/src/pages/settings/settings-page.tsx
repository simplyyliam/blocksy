// Settings: Java path, default project folder, theme, updates.
import { FolderOpen } from "lucide-react"
import { useEffect, useState } from "react"
import { getVersion } from "@tauri-apps/api/app"
import { open as pickFolder } from "@tauri-apps/plugin-dialog"
import { applyTheme, Button, Select, Spinner } from "@blocksy/ui"
import { registries } from "../../app/modules"
import { errorMessage } from "../../shared/api"
import { prettyPath } from "../../shared/paths"
import { useJava } from "../../shared/stores/java"
import { useSettings } from "../../shared/stores/settings"
import { useUpdates } from "../../shared/stores/updates"
import { Page, Section } from "../page"

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="min-w-0">
        <p className="text-base text-fg">{label}</p>
        {hint && <p className="mt-0.5 truncate text-sm text-fg-muted">{hint}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1">{children}</div>
    </div>
  )
}

const AUTO = "__auto__"

export function SettingsPage() {
  const settings = useSettings()
  const java = useJava()
  const updates = useUpdates()
  const [appVersion, setAppVersion] = useState("")
  const [checking, setChecking] = useState(false)
  const [updateNote, setUpdateNote] = useState<string | null>(null)

  useEffect(() => {
    void getVersion().then(setAppVersion)
  }, [])

  const chooseJava = async (home: string) => {
    const javaHome = home === AUTO ? null : home
    await settings.update({ javaHome })
    await java.detect(javaHome, java.required)
  }

  const chooseFolder = async () => {
    const picked = await pickFolder({ directory: true, title: "Default project folder" })
    if (typeof picked === "string") await settings.update({ projectsDir: picked })
  }

  const chooseTheme = async (id: string) => {
    const theme = registries.themes.get(id)
    if (theme) applyTheme(theme)
    await settings.update({ theme: id })
  }

  const checkNow = async () => {
    setChecking(true)
    setUpdateNote(null)
    try {
      const version = await updates.checkNow()
      setUpdateNote(version ? `Blocksy ${version} is downloading` : "You're up to date")
    } catch (err) {
      setUpdateNote(errorMessage(err))
    } finally {
      setChecking(false)
    }
  }

  const usableJava = java.installs.filter((j) => j.is_jdk && j.major >= java.required)

  return (
    <Page title="Settings">
      <Section title="Java">
        <Row label="JDK" hint={java.active ? java.active.home : `Needs Java ${java.required} or newer`}>
          <Select
            value={settings.javaHome ?? AUTO}
            onChange={(v) => void chooseJava(v)}
            className="h-7 min-w-[220px] rounded-md bg-surface"
            options={[
              { value: AUTO, label: "Automatic (newest found)" },
              ...usableJava.map((j) => ({ value: j.home, label: `Java ${j.version} · ${j.vendor}` })),
            ]}
          />
        </Row>
      </Section>

      <Section title="Projects">
        <Row label="Default folder" hint={prettyPath(settings.projectsDir ?? settings.defaultProjectsDir ?? "", settings.home)}>
          <Button onClick={() => void chooseFolder()}>
            <FolderOpen strokeWidth={1.75} /> Change…
          </Button>
          {settings.projectsDir && <Button onClick={() => void settings.update({ projectsDir: null })}>Reset</Button>}
        </Row>
      </Section>

      <Section title="Appearance">
        <Row label="Theme" hint="The Minecraft theme arrives in v0.2">
          <Select
            value={settings.theme}
            onChange={(v) => void chooseTheme(v)}
            className="h-7 min-w-[160px] rounded-md bg-surface"
            options={registries.themes.list().map((t) => ({ value: t.id, label: t.name }))}
          />
        </Row>
      </Section>

      <Section title="Updates">
        <Row
          label={appVersion ? `Blocksy ${appVersion}` : "Blocksy"}
          hint={
            updateNote ??
            (updates.state === "disabled"
              ? "Automatic updates are off in this build"
              : updates.state === "ready"
                ? `Blocksy ${updates.version} is ready. Restart from the status bar.`
                : "Checks for updates on start and every few hours")
          }
        >
          <Button onClick={() => void checkNow()} disabled={checking || updates.state === "disabled"}>
            {checking && <Spinner />} Check for updates
          </Button>
        </Row>
      </Section>
    </Page>
  )
}
