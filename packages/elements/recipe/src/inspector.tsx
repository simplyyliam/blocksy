// The Recipe's editor panel. The grid itself is on the canvas; here are the details:
// name, kind, cooking time and experience, and where the JSON file goes.
import type { ElementEditorProps } from "@blocksy/core"
import { refLabel, resolveRef } from "@blocksy/game-data"
import {
  Input, InspectorField, InspectorSection, NumberInput, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@blocksy/ui"
import { fieldDoc } from "./docs.ts"
import { changeKind, isCooking, RECIPE_KINDS, recipeProblems, type RecipeData, type RecipeKind } from "./schema.ts"

const KIND_ITEMS = RECIPE_KINDS.map((k) => ({ value: k, label: k[0]!.toUpperCase() + k.slice(1) }))
const CATEGORY_ITEMS = [
  { value: "food", label: "Food" },
  { value: "blocks", label: "Blocks" },
  { value: "misc", label: "Misc" },
]

function Choose({ id, value, items, onChange }: { id: string; value: string; items: { value: string; label: string }[]; onChange(v: string): void }) {
  return (
    <Select items={items} value={value} onValueChange={(v) => v !== null && onChange(v)}>
      <SelectTrigger id={id} size="sm" className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function RecipeInspector({ element, project, change, rename }: ElementEditorProps<RecipeData>) {
  const data = element.data
  const set = (patch: Partial<RecipeData>) => change({ ...data, ...patch })
  const problems = recipeProblems(data)
  const result = data.result ? resolveRef(data.result, project) : null

  return (
    <div className="flex flex-col divide-y divide-line-subtle py-1">
      <InspectorSection title="Recipe">
        <InspectorField label="Name" description="Only for you: the name in the project tree. The file is named after the id.">
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
        <InspectorField label="Kind" java={`"type": "minecraft:${data.kind === "shaped" || data.kind === "shapeless" ? `crafting_${data.kind}` : data.kind}"`} description={fieldDoc("kind").description}>
          {(id) => <Choose id={id} value={data.kind} items={KIND_ITEMS} onChange={(v) => change(changeKind(data, v as RecipeKind))} />}
        </InspectorField>
        <InspectorField label="Makes" java={result ? `"result": { "id": "${result}", "count": ${data.count} }` : undefined} description={fieldDoc("result").description}>
          {() => <span className="truncate text-sm text-fg-muted">{data.result ? `${data.count} × ${refLabel(data.result, project)}` : "Nothing yet"}</span>}
        </InspectorField>
      </InspectorSection>

      {isCooking(data.kind) && (
        <InspectorSection title="Cooking">
          <InspectorField label="Time (seconds)" java={`"cookingtime": ${data.cookingTime}`} description={fieldDoc("cookingTime").description}>
            {(id) => <NumberInput id={id} value={data.cookingTime / 20} min={0.05} max={1600} onCommit={(s) => set({ cookingTime: Math.max(1, Math.round(s * 20)) })} />}
          </InspectorField>
          <InspectorField label="Experience" java={`"experience": ${data.experience}`} description={fieldDoc("experience").description}>
            {(id) => <NumberInput id={id} value={data.experience} min={0} max={100} onCommit={(experience) => set({ experience })} />}
          </InspectorField>
          <InspectorField label="Recipe book tab" java={`"category": "${data.category}"`} description={fieldDoc("category").description}>
            {(id) => <Choose id={id} value={data.category} items={CATEGORY_ITEMS} onChange={(v) => set({ category: v as RecipeData["category"] })} />}
          </InspectorField>
        </InspectorSection>
      )}

      <InspectorSection title="File">
        <code className="font-mono text-xs break-all text-fg-muted" data-selectable>
          data/{project.modId}/recipe/{element.id}.json
        </code>
        {problems.length > 0 ? (
          <ul className="flex flex-col gap-1 text-xs text-fg-muted">
            {problems.map((p) => (
              <li key={p}>• {p}</li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-fg-muted">Ready: written on the next Build. Switch to Code to read the JSON.</p>
        )}
      </InspectorSection>
    </div>
  )
}
