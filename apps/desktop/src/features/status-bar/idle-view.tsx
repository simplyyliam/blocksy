// Idle: what the project is built with (loader + Minecraft version) and the JDK.
import { AlertTriangle, CircleCheck, Package } from "lucide-react"
import { Button, Spinner } from "@blocksy/ui"
import { statusButton, statusItem } from "./chip"
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
        <span className={statusItem}>
          <Package strokeWidth={1.75} />
          {project.targetName} {project.version.minecraft}
        </span>
      )}
      {/* Click to see or change which Java Blocksy uses. */}
      <Button variant="ghost" size="xs" className={statusButton} onClick={() => go("jdk")}>
        {java.status === "checking" && <Spinner className="text-fg-muted" />}
        {java.status === "ready" && <CircleCheck strokeWidth={1.75} />}
        {java.status === "missing" && <AlertTriangle className="text-warning" strokeWidth={1.75} />}
        {java.status === "checking" ? "Looking for Java" : java.status === "ready" ? `JDK ${java.active?.major} found` : "JDK needed"}
      </Button>
    </>
  )
}

export const idleView: StatusView = { id: "idle", priority: 0, when: () => true, View: IdleView }
