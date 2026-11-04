// The Tag's canvas and inspector.
//
//   canvas:     #berry_mod:fruits                     inspector:  Name, Holds, Adds to,
//               [▣ Berry Bun ×] [A Apple ×] [+]                  file path, how to use it
//
// Entries are references (items, blocks, other tags). Every change is one undo step.
import { Hash, Plus, X } from "lucide-react"
import { useState } from "react"
import type { ElementEditorProps } from "@blocksy/core"
import { ItemPicker, RefTile, refLabel, resolveRef } from "@blocksy/game-data"
import {
  Button, cn, CanvasBackdrop, Input, InspectorField, InspectorSection, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@blocksy/ui"
import { RESERVED_BLOCK_TAGS, TAG_ID, tagFilePath, type TagData } from "./schema.ts"
import { tagDocs } from "./docs.ts"

const fieldDoc = (key: string) => tagDocs.fields.find((f) => f.key === key)!
const fullId = (data: TagData, id: string, modId: string) => data.target ?? `${modId}:${id}`

export function TagCanvas({ element, project, change }: ElementEditorProps<TagData>) {
  const data = element.data
  const set = (patch: Partial<TagData>) => change({ ...data, ...patch })
  const add = (ref: string) => !data.values.includes(ref) && set({ values: [...data.values, ref] })
  return (
    <div className="relative grid size-full place-items-center">
      <CanvasBackdrop />
      <div className="relative flex w-full max-w-xl flex-col gap-3 px-6 pb-20">
        <div className="flex items-center gap-2 text-fg">
          <span className="grid size-8 place-items-center rounded-lg bg-bg shadow-sm">
            <Hash className="size-4 text-fg-muted" strokeWidth={2} />
          </span>
          <code className="truncate font-mono text-md" data-selectable>
            #{fullId(data, element.id, project.modId)}
          </code>
          <span className="ml-auto shrink-0 text-xs text-fg-muted">
            {data.values.length} {data.values.length === 1 ? "entry" : "entries"}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 rounded-2xl bg-bg/95 p-4 shadow-md backdrop-blur-md">
          {data.values.map((ref) => {
            const missing = resolveRef(ref, project) === null
            return (
              <span
                key={ref}
                className={cn("group flex h-9 items-center gap-2 rounded-lg bg-surface pr-1 pl-1.5 text-sm text-fg", missing && "ring-2 ring-danger/60")}
                title={missing ? "This element no longer exists" : ref}
              >
                <RefTile refValue={ref} project={project} className="size-6" />
                <span className="max-w-40 truncate">{refLabel(ref, project)}</span>
                <Button variant="ghost" size="icon-xs" aria-label={`Remove ${refLabel(ref, project)}`} onClick={() => set({ values: data.values.filter((v) => v !== ref) })}>
                  <X strokeWidth={2} />
                </Button>
              </span>
            )
          })}
          <ItemPicker
            project={project}
            allowTags
            registry={data.registry}
            onPick={add}
            trigger={
              <Button variant="secondary" size="sm" className="h-9 gap-1.5 px-3">
                <Plus strokeWidth={2} /> Add {data.registry === "block" ? "block" : "item"}
              </Button>
            }
          />
        </div>
        <p className="text-center text-xs text-fg-faint">
          {data.registry === "item"
            ? `Use it in a recipe slot as #${element.id} (this mod's tags are listed under Tags).`
            : "Block tags change how blocks behave, for example which tool mines them."}
        </p>
      </div>
    </div>
  )
}

export function TagInspector({ element, project, change, rename }: ElementEditorProps<TagData>) {
  const data = element.data
  const [error, setError] = useState<string | null>(null)
  const commitTarget = (text: string) => {
    const value = text.trim().replace(/^#/, "").toLowerCase()
    if (!value) {
      setError(null)
      if (data.target !== null) change({ ...data, target: null })
      return
    }
    if (!TAG_ID.test(value)) return setError("Use a tag id like minecraft:planks")
    if (data.registry === "block" && RESERVED_BLOCK_TAGS.some((r) => r.test(value))) return setError("Blocksy fills this tag from each block's Tool setting")
    setError(null)
    if (value !== data.target) change({ ...data, target: value })
  }
  return (
    <div className="flex flex-col divide-y divide-line-subtle py-1">
      <InspectorSection title="Tag">
        <InspectorField label="Name" description="Only for you: the name in the project tree.">
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
        <InspectorField label="Holds" description={fieldDoc("registry").description}>
          {(id) => (
            <Select
              items={[
                { value: "item", label: "Items" },
                { value: "block", label: "Blocks" },
              ]}
              value={data.registry}
              onValueChange={(v) => v && v !== data.registry && change({ ...data, registry: v as TagData["registry"], values: [], target: null })}
            >
              <SelectTrigger id={id} size="sm" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectItem value="item">Items</SelectItem>
                <SelectItem value="block">Blocks</SelectItem>
              </SelectContent>
            </Select>
          )}
        </InspectorField>
        <InspectorField label="Adds to" description={fieldDoc("target").description} stacked>
          {(id) => (
            <div className="flex w-full flex-col gap-1">
              <Input
                id={id}
                key={data.target ?? ""}
                defaultValue={data.target ?? ""}
                placeholder={`New tag: ${project.modId}:${element.id}`}
                spellCheck={false}
                aria-invalid={!!error}
                className="h-8 font-mono text-xs"
                onBlur={(e) => commitTarget(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              />
              {error ? <p className="text-xs text-danger">{error}</p> : <p className="text-xs text-fg-faint">Empty = a new tag. Or an existing one, like c:foods/fruit.</p>}
            </div>
          )}
        </InspectorField>
      </InspectorSection>
      <InspectorSection title="File">
        <code className="font-mono text-xs break-all text-fg-muted" data-selectable>
          data/{tagFilePath(data, element.id, project.modId)}
        </code>
        <p className="text-xs text-fg-muted">{data.values.length === 0 ? "Empty tags aren't written. Add an entry on the canvas." : "Written on the next Build."}</p>
      </InspectorSection>
    </div>
  )
}
