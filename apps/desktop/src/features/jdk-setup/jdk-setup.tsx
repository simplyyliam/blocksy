// JDK setup: shows the Java installs Blocksy found, which one it builds with, and
// how to get a suitable JDK if none is new enough.
import { Check, ExternalLink, FolderOpen, RotateCw } from "lucide-react"
import { open as pickFolder } from "@tauri-apps/plugin-dialog"
import { openUrl } from "@tauri-apps/plugin-opener"
import { Button, cn, Item, ItemContent, ItemDescription, ItemMedia, ItemTitle, Spinner } from "@blocksy/ui"
import { useJava } from "../../shared/stores/java"
import { useSettings } from "../../shared/stores/settings"

/** Eclipse Temurin: free, open-source JDK builds. */
const DOWNLOAD_URL = "https://adoptium.net/temurin/releases/"

export function JdkSetup() {
  const { status, installs, active, required, detect } = useJava()
  const update = useSettings((s) => s.update)

  const choose = async (home: string | null) => {
    await update({ javaHome: home })
    await detect(home, required)
  }

  const browse = async () => {
    const picked = await pickFolder({ directory: true, title: "Choose a JDK folder" })
    if (typeof picked === "string") await choose(picked)
  }

  return (
    <div className="flex flex-col">
      <p className="text-base text-fg-muted">
        Minecraft mods are written in Java. Blocksy needs a JDK, version {required} or newer, to build and run your mod.
      </p>

      <div className="mt-6 flex flex-col gap-1">
        {status === "checking" && (
          <div className="flex h-10 items-center gap-2 text-base text-fg-muted">
            <Spinner /> Looking for Java…
          </div>
        )}
        {status !== "checking" && installs.length === 0 && <p className="h-10 text-base text-fg-muted">No Java found on this computer.</p>}
        {installs.map((java) => {
          const usable = java.is_jdk && java.major >= required
          const chosen = active?.home === java.home
          return (
            <Item
              key={java.home}
              size="sm"
              render={<button type="button" disabled={!usable} onClick={() => void choose(java.home)} />}
              className={cn("w-full text-left", chosen ? "bg-surface" : usable ? "hover:bg-surface/60" : "opacity-60")}
            >
              <ItemMedia className="size-4">{chosen && <Check className="size-3.5 text-success" strokeWidth={2.25} />}</ItemMedia>
              <ItemContent className="min-w-0">
                <ItemTitle className="font-normal">
                  Java {java.version} <span className="text-fg-muted">· {java.vendor || "Unknown vendor"}</span>
                </ItemTitle>
                <ItemDescription className="truncate text-xs" data-selectable>
                  {java.home}
                  {!java.is_jdk && " · runtime only, needs a full JDK"}
                  {java.is_jdk && java.major < required && ` · too old, needs ${required}+`}
                </ItemDescription>
              </ItemContent>
            </Item>
          )
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-1">
        <Button variant="secondary" size="sm" onClick={() => void detect(useSettings.getState().javaHome, required)}>
          <RotateCw strokeWidth={1.75} /> Check again
        </Button>
        <Button variant="secondary" size="sm" onClick={() => void browse()}>
          <FolderOpen strokeWidth={1.75} /> Choose folder…
        </Button>
        {status === "missing" && (
          <Button variant="default" size="sm" onClick={() => void openUrl(DOWNLOAD_URL)}>
            Get Java {required} <ExternalLink strokeWidth={1.75} />
          </Button>
        )}
      </div>
      {status === "missing" && (
        <p className="mt-3 text-xs text-fg-muted">Install it, then press Check again. Any JDK {required}+ works; Eclipse Temurin is free.</p>
      )}
    </div>
  )
}
