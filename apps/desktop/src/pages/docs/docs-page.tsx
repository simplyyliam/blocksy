// Docs: the in-app documentation (@blocksy/docs, Fumadocs inside). Loaded lazily the
// first time you open Docs, with a pixel loader meanwhile, so app start stays fast.
// The page path lives in the navigation store; links inside Docs move it.
import { getVersion } from "@tauri-apps/api/app"
import { openUrl } from "@tauri-apps/plugin-opener"
import { lazy, Suspense, useEffect, useState } from "react"
import { PixelLoader } from "@blocksy/ui"
import { registries } from "../../app/modules"
import { useNavigation } from "../../shared/stores/navigation"

const DocsApp = lazy(() => import("@blocksy/docs").then((m) => ({ default: m.DocsApp })))

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

export function DocsPage() {
  const path = useNavigation((s) => s.docsPath)
  const openDocs = useNavigation((s) => s.openDocs)
  const [version, setVersion] = useState("0.2")
  useEffect(() => {
    void getVersion().then(setVersion).catch(() => {})
  }, [])

  // A new page starts at the top.
  useEffect(() => {
    document.querySelector("main")?.scrollTo({ top: 0 })
  }, [path])

  return (
    <Suspense fallback={<Loading />}>
      <DocsApp path={path} navigate={openDocs} openExternal={(url) => void openUrl(url)} elementTypes={elementTypes} version={version} platform={platform} />
    </Suspense>
  )
}
