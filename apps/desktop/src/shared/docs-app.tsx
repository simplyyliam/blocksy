// The in-app documentation (@blocksy/docs, Fumadocs inside), loaded lazily the first time it is
// shown with a pixel loader meanwhile, so app start stays fast. Shared by the Docs page (Home)
// and the Docs tab inside a project; each owns where "the current page" is stored.
import { getVersion } from "@tauri-apps/api/app"
import { openUrl } from "@tauri-apps/plugin-opener"
import { lazy, Suspense, useEffect, useState } from "react"
import { loadDocsApp } from "@blocksy/docs"
import { PixelLoader } from "@blocksy/ui"
import { registries } from "../app/modules"

const DocsApp = lazy(() => loadDocsApp().then((m) => ({ default: m.DocsApp })))

// Stable for the docs' memoised page list (element types don't change while running).
const elementTypes = registries.elementTypes.list()

/** "Fabric · Minecraft 26.1.2, 26.3", from the registered loader targets (core never names one). */
const platform = registries.loaderTargets
  .list()
  .map((t) => `${t.name} · Minecraft ${t.versions.map((v) => v.minecraft).join(", ")}`)
  .join(" / ")

function Loading() {
  return (
    <div className="grid h-full place-items-center">
      <span className="flex flex-col items-center gap-2.5 text-xs text-fg-muted">
        <PixelLoader className="size-6 text-brand" label="Loading Docs" />
        Loading Docs
      </span>
    </div>
  )
}

export function DocsContent({ path, navigate, compact }: { path: string; navigate(path: string): void; compact?: boolean }) {
  const [version, setVersion] = useState("0.2")
  useEffect(() => {
    void getVersion().then(setVersion).catch(() => {})
  }, [])
  return (
    <Suspense fallback={<Loading />}>
      <DocsApp compact={compact} path={path} navigate={navigate} openExternal={(url) => void openUrl(url)} elementTypes={elementTypes} version={version} platform={platform} />
    </Suspense>
  )
}
