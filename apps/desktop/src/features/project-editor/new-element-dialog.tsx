// "New element" (N, File menu, or a "+" in the tree): pick a type, type a name, Enter.
// The element's id comes from this first name and never changes (ADR 0009).
import { useState } from "react"
import {
  Button, cn, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input,
} from "@blocksy/ui"
import { elementModules, registries } from "../../app/modules"
import { createElement } from "../../shared/element-actions"
import { useEditor } from "../../shared/stores/editor"

export function NewElementDialog() {
  const open = useEditor((s) => s.newElementOpen)
  const preset = useEditor((s) => s.newElementType)
  const close = useEditor((s) => s.closeNewElement)
  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      {/* Remounted per opening, so the form always starts fresh. */}
      <DialogContent className="sm:max-w-md">{open && <Form preset={preset} onDone={close} />}</DialogContent>
    </Dialog>
  )
}

function Form({ preset, onDone }: { preset: string | null; onDone(): void }) {
  const types = registries.elementTypes.list()
  const [typeId, setTypeId] = useState(preset ?? (types.some((t) => t.id === "block") ? "block" : types[0]?.id) ?? "")
  const [name, setName] = useState("")
  const type = types.find((t) => t.id === typeId)

  const submit = () => {
    if (createElement(typeId, name)) onDone()
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>New element</DialogTitle>
        <DialogDescription>Pick what to make, then give it a name.</DialogDescription>
      </DialogHeader>
      <div role="radiogroup" aria-label="Element type" className="grid grid-cols-3 gap-1.5">
        {types.map((t) => {
          const Icon = elementModules.get(t.id)?.Icon
          const on = t.id === typeId
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setTypeId(t.id)}
              className={cn(
                "flex h-14 flex-col items-center justify-center gap-1 rounded-xl text-xs text-fg-muted outline-none transition-colors",
                "bg-surface hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ring/50",
                on && "bg-surface-hover text-fg ring-2 ring-ring/40",
              )}
            >
              {Icon && <Icon className="size-4" strokeWidth={1.75} />}
              {t.name}
            </button>
          )
        })}
      </div>
      <Input
        autoFocus
        value={name}
        spellCheck={false}
        aria-label="Name"
        placeholder={`Name, e.g. Ruby ${type?.name ?? "Block"}`}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      <DialogFooter>
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button disabled={!name.trim()} onClick={submit}>
          Create
        </Button>
      </DialogFooter>
    </>
  )
}
