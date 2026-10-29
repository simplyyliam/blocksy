// Idle: what the project is built with (loader + Minecraft version) and the JDK.
import { AlertTriangle, CircleCheck, Package } from "lucide-react"
import { Pill, Spinner } from "@blocksy/ui"
import { useJava } from "../../shared/stores/java"
import { useNavigation } from "../../shared/stores/navigation"
import { useProject } from "../../shared/stores/project"
import type { StatusView } from "./types"

function IdleView() {
  const project = useProject((s) => s.current)
  const java = useJava()
  const go = useNavigation((s) => s.go)

  return (
    <>
      {project && (
        <Pill>
          <Package strokeWidth={1.75} />
          {project.targetName} {project.version.minecraft}
        </Pill>
      )}
      <button type="button" onClick={() => go("jdk")} className="rounded-md outline-none focus-visible:shadow-[0_0_0_3px_var(--b-focus)]">
        <Pill className="transition-colors hover:bg-surface-hover">
          {java.status === "checking" && <Spinner className="text-fg-muted" />}
          {java.status === "ready" && <CircleCheck strokeWidth={1.75} />}
          {java.status === "missing" && <AlertTriangle className="text-warning" strokeWidth={1.75} />}
          {java.status === "checking" ? "Looking for Java" : java.status === "ready" ? `JDK ${java.active?.major} found` : "JDK needed"}
        </Pill>
      </button>
    </>
  )
}

export const idleView: StatusView = { id: "idle", priority: 0, when: () => true, View: IdleView }
