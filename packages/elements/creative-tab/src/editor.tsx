// The Creative tab's editor panel and canvas.
// The canvas is a calm sketch of a creative inventory page (Blocksy's own drawing,
// not Minecraft's GUI art): the tab on top, its blocks in a 9-wide slot grid.
import type { ElementEditorProps } from "@blocksy/core"
import {
  Button, cn, DotPattern, Input, InspectorField, InspectorSection, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@blocksy/ui"
import { tabEntries, type CreativeTabData } from "./element.ts"

const textureOf = (data: unknown) => {
  const texture = (data as { texture?: unknown } | null)?.texture
  return typeof texture === "string" ? `data:image/png;base64,${texture}` : null
}

export function CreativeTabInspector({ element, project, change, rename, select }: ElementEditorProps<CreativeTabData>) {
  const entries = tabEntries(project, element.id)
  return (
    <div className="flex flex-col divide-y divide-line-subtle py-1">
      <InspectorSection title="Creative tab">
        <InspectorField label="Title" java={`"itemGroup.${project.modId}.${element.id}"`}>
          {(id) => (
            <Input
              id={id}
              key={element.name}
              defaultValue={element.name}
              spellCheck={false}
              className="h-8"
              onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== element.name && rename(e.target.value.trim())}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            />
          )}
        </InspectorField>
        <InspectorField label="Icon">
          {(id) => (
            <Select
              items={[{ value: "auto", label: "First block" }, ...entries.map((e) => ({ value: e.id, label: e.name }))]}
              value={element.data.icon ?? "auto"}
              onValueChange={(v) => v !== null && change({ icon: v === "auto" ? null : v })}
            >
              <SelectTrigger id={id} size="sm" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectItem value="auto">First block</SelectItem>
                {entries.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </InspectorField>
      </InspectorSection>
      <InspectorSection title={`Contents · ${entries.length}`}>
        {entries.length === 0 && <p className="text-xs text-fg-muted">Empty. Pick this tab in a block's inspector (Creative tab → Shows in).</p>}
        <div className="flex flex-col gap-0.5">
          {entries.map((e) => (
            <Button key={e.id} variant="ghost" size="sm" className="justify-start gap-2 px-1.5" onClick={() => select(e.id)}>
              {textureOf(e.data) ? (
                <img src={textureOf(e.data)!} alt="" className="size-4 [image-rendering:pixelated]" />
              ) : (
                <span className="size-4 rounded-xs bg-surface-pressed" />
              )}
              <span className="truncate">{e.name}</span>
            </Button>
          ))}
        </div>
      </InspectorSection>
    </div>
  )
}

export function CreativeTabCanvas({ element, project, select }: ElementEditorProps<CreativeTabData>) {
  const entries = tabEntries(project, element.id)
  const icon = entries.find((e) => e.id === element.data.icon) ?? entries[0]
  const slots = Math.max(27, Math.ceil(entries.length / 9) * 9)
  return (
    <div className="relative grid size-full place-items-center">
      <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_15%,transparent_65%)]">
        <DotPattern width={18} height={18} cr={0.9} className="text-line" />
      </div>
      <div className="relative flex flex-col">
        {/* The tab itself, sitting on the panel. */}
        <div className="flex w-fit items-center gap-2 rounded-t-lg bg-surface px-3 pt-2 pb-1.5">
          {icon && textureOf(icon.data) ? (
            <img src={textureOf(icon.data)!} alt="" className="size-5 [image-rendering:pixelated]" />
          ) : (
            <span className="size-5 rounded-xs bg-surface-pressed" />
          )}
          <span className="text-sm text-fg">{element.name}</span>
        </div>
        <div className="grid grid-cols-9 gap-1 rounded-lg rounded-tl-none bg-surface p-2.5 shadow-md">
          {Array.from({ length: slots }, (_, i) => {
            const entry = entries[i]
            const texture = entry && textureOf(entry.data)
            return (
              <button
                key={entry?.id ?? `empty-${i}`}
                type="button"
                disabled={!entry}
                title={entry?.name}
                onClick={() => entry && select(entry.id)}
                className={cn(
                  "grid size-9 place-items-center rounded-sm bg-surface-pressed transition-transform duration-150 ease-out",
                  entry && "hover:-translate-y-0.5 hover:bg-surface-hover",
                )}
              >
                {texture && <img src={texture} alt={entry.name} className="size-6 [image-rendering:pixelated]" />}
              </button>
            )
          })}
        </div>
        <p className="mt-3 text-center text-xs text-fg-muted">How the tab will look in the creative inventory. Click a block to edit it.</p>
      </div>
    </div>
  )
}
