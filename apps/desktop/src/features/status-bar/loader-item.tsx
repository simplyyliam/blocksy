// Loader and Minecraft version the project is built with, e.g. "Fabric 26.1.2". The popover
// lists the details (loader, version, mod id).
import { Package } from "lucide-react"
import { Button, Popover, PopoverContent, PopoverTrigger } from "@blocksy/ui"
import { useProject } from "../../shared/stores/project"
import { statusButton, statusPopover } from "./chip"

export function LoaderItem() {
  const project = useProject((s) => s.current)
  if (!project) return null
  const rows: [string, string][] = [
    ["Loader", project.targetName],
    ["Minecraft", project.version.minecraft],
    ["Mod id", project.doc.modId],
  ]
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="ghost" size="xs" className={statusButton} />}>
        <Package strokeWidth={1.75} />
        {project.targetName} {project.version.minecraft}
      </PopoverTrigger>
      <PopoverContent side="top" align="end" className={statusPopover}>
        <p className="font-medium text-fg">Built with</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
          {rows.map(([name, value]) => (
            <div key={name} className="contents">
              <dt className="text-fg-muted">{name}</dt>
              <dd className="truncate text-right font-mono text-xs text-fg">{value}</dd>
            </div>
          ))}
        </dl>
      </PopoverContent>
    </Popover>
  )
}
