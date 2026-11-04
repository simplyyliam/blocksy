// The lang editor: canvas (the translation table) and inspector (language, progress, file).
//
//   ┌ German · 3 of 5 translated ─────────────── [ search ] ┐
//   │ item.berry_mod.berry_bun   Berry Bun   [ Beerenbrötchen ] │
//   │ itemGroup.berry_mod.tab    Berry Mod   [               ] │
//   │ + Custom key                                            │
//   └─────────────────────────────────────────────────────────┘
//
// Keys come from the elements (ElementType.lang), so renaming an item updates the English
// column right away. Each field commits on blur: one edit = one undo step.
import { Plus, Search, Trash2 } from "lucide-react"
import { useState } from "react"
import type { ElementEditorProps } from "@blocksy/core"
import {
  Button, Input, InspectorField, InspectorSection, Progress, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@blocksy/ui"
import { KEY_PATTERN, LOCALE_PATTERN, LOCALES, localeName, progress, projectKeys, type LanguageData } from "./schema.ts"

/** One translation cell: commits on blur or Enter. */
function Cell({ value, placeholder, label, onCommit }: { value: string; placeholder: string; label: string; onCommit(text: string): void }) {
  return (
    <Input
      key={value}
      defaultValue={value}
      placeholder={placeholder}
      aria-label={label}
      spellCheck
      className="h-8 text-sm"
      onBlur={(e) => e.target.value !== value && onCommit(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
    />
  )
}

export function LanguageCanvas({ element, project, change, elementTypes = [] }: ElementEditorProps<LanguageData>) {
  const data = element.data
  const [query, setQuery] = useState("")
  const english = projectKeys(project, elementTypes)
  const keys = Object.keys(english)
  const custom = Object.keys(data.entries).filter((k) => !(k in english))
  const isEnglish = data.locale === "en_us"
  const { done, total } = progress(data, keys)
  const q = query.trim().toLowerCase()
  const visible = (key: string) => !q || key.toLowerCase().includes(q) || (english[key] ?? "").toLowerCase().includes(q) || (data.entries[key] ?? "").toLowerCase().includes(q)

  const setEntry = (key: string, text: string) => {
    const entries = { ...data.entries }
    if (text.trim() === "" && key in english) delete entries[key]
    else entries[key] = text
    change({ ...data, entries })
  }
  const removeKey = (key: string) => {
    const entries = { ...data.entries }
    delete entries[key]
    change({ ...data, entries })
  }

  return (
    <div className="flex size-full justify-center overflow-y-auto px-6 pt-6 pb-24">
      <div className="flex w-full max-w-3xl flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0">
            <h2 className="text-md font-medium text-fg">{localeName(data.locale)}</h2>
            <p className="text-xs text-fg-muted">
              {isEnglish ? "Overrides for the English names Blocksy writes." : `${done} of ${total} translated. Empty ones fall back to English.`}
            </p>
          </div>
          <label className="relative ml-auto w-56">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-fg-faint" strokeWidth={2} />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search keys and text" aria-label="Search translations" className="h-8 pl-8 text-sm" />
          </label>
        </div>

        <div className="overflow-hidden rounded-2xl bg-bg/95 shadow-md">
          <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.3fr)] gap-x-3 border-b border-line-subtle px-4 py-2 text-xs text-fg-muted">
            <span>Key</span>
            <span>English</span>
            <span>{isEnglish ? "Override" : localeName(data.locale)}</span>
          </div>
          {keys.length === 0 && custom.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-fg-muted">Nothing to translate yet. Add blocks, items or creative tabs and their names show up here.</p>
          )}
          <div className="divide-y divide-line-subtle">
            {keys.filter(visible).map((key) => (
              <div key={key} className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.3fr)] items-center gap-x-3 px-4 py-1.5">
                <code className="truncate font-mono text-xs text-fg-faint" title={key} data-selectable>
                  {key}
                </code>
                <span className="truncate text-sm text-fg" title={english[key]}>
                  {english[key]}
                </span>
                <Cell value={data.entries[key] ?? ""} placeholder={isEnglish ? english[key]! : "Not translated"} label={`${localeName(data.locale)} text for ${key}`} onCommit={(t) => setEntry(key, t)} />
              </div>
            ))}
            {custom.filter(visible).map((key) => (
              <div key={key} className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.3fr)] items-center gap-x-3 px-4 py-1.5">
                <code className="truncate font-mono text-xs text-fg-faint" title={key} data-selectable>
                  {key}
                </code>
                <span className="text-xs text-fg-faint italic">Custom key</span>
                <div className="flex items-center gap-1">
                  <Cell value={data.entries[key] ?? ""} placeholder="Text" label={`Text for ${key}`} onCommit={(t) => setEntry(key, t)} />
                  <Button variant="ghost" size="icon-sm" aria-label={`Remove ${key}`} title="Remove key" onClick={() => removeKey(key)}>
                    <Trash2 strokeWidth={1.75} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <AddKey taken={[...keys, ...custom]} onAdd={(key) => setEntry(key, "")} />
        </div>
      </div>
    </div>
  )
}

/** "+ Custom key": a key the project doesn't make yet (for your own code or a later release). */
function AddKey({ taken, onAdd }: { taken: string[]; onAdd(key: string): void }) {
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  if (!adding) {
    return (
      <Button variant="ghost" size="sm" className="m-1.5 gap-1.5 px-2.5 text-fg-muted" onClick={() => setAdding(true)}>
        <Plus strokeWidth={2} /> Custom key
      </Button>
    )
  }
  return (
    <div className="flex flex-col gap-1 px-4 py-2">
      <Input
        autoFocus
        placeholder="message.my_mod.welcome"
        aria-label="New key"
        spellCheck={false}
        aria-invalid={!!error}
        className="h-8 font-mono text-xs"
        onBlur={(e) => {
          const key = e.target.value.trim()
          if (key && !KEY_PATTERN.test(key)) return setError("Keys use letters, digits, dots, _ and -")
          if (key && taken.includes(key)) return setError("That key is already in the list")
          if (key) onAdd(key)
          setError(null)
          setAdding(false)
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") e.currentTarget.value = ""
          if (e.key === "Enter" || e.key === "Escape") e.currentTarget.blur()
        }}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}

export function LanguageInspector({ element, project, change, rename, elementTypes = [] }: ElementEditorProps<LanguageData>) {
  const data = element.data
  const keys = Object.keys(projectKeys(project, elementTypes))
  const { done, total } = progress(data, keys)
  const [error, setError] = useState<string | null>(null)
  const known = LOCALES.some((l) => l.id === data.locale)
  const duplicate = project.elements.some((e) => e.id !== element.id && e.type === element.type && (e.data as LanguageData).locale === data.locale)
  return (
    <div className="flex flex-col divide-y divide-line-subtle py-1">
      <InspectorSection title="Language">
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
        <InspectorField label="Language" java={`lang/${data.locale}.json`} description="Which language these translations are for. Players pick their language in Minecraft's options.">
          {(id) => (
            <Select
              items={LOCALES.map((l) => ({ value: l.id, label: l.name }))}
              value={known ? data.locale : null}
              onValueChange={(v) => v && change({ ...data, locale: v })}
            >
              <SelectTrigger id={id} size="sm" className="w-full">
                <SelectValue placeholder={data.locale} />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {LOCALES.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </InspectorField>
        <InspectorField label="Code" description="Minecraft's language code. Pick from the list, or type any code (like lol_us).">
          {(id) => (
            <Input
              id={id}
              key={data.locale}
              defaultValue={data.locale}
              spellCheck={false}
              aria-invalid={!!error}
              className="h-8 font-mono text-xs"
              onBlur={(e) => {
                const code = e.target.value.trim().toLowerCase()
                if (!LOCALE_PATTERN.test(code)) return setError("Use a code like de_de")
                setError(null)
                if (code !== data.locale) change({ ...data, locale: code })
              }}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            />
          )}
        </InspectorField>
        {error && <p className="-mt-1 text-xs text-danger">{error}</p>}
        {duplicate && <p className="text-xs text-warning">Another Language element uses {data.locale} too. Both are merged; the one lower in the tree wins.</p>}
      </InspectorSection>
      <InspectorSection title="Progress">
        {data.locale === "en_us" ? (
          <p className="text-xs text-fg-muted">English is written from your element names. Text here replaces it, key by key.</p>
        ) : (
          <>
            <p className="text-sm text-fg tabular-nums">
              {done} of {total} keys
            </p>
            <Progress value={total ? (done / total) * 100 : 0} aria-label="Translated" className="h-1" />
          </>
        )}
        <code className="font-mono text-xs break-all text-fg-muted" data-selectable>
          assets/{project.modId}/lang/{data.locale}.json
        </code>
      </InspectorSection>
    </div>
  )
}
