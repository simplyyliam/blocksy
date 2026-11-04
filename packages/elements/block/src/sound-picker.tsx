// The block's Sound field (v0.3): the familiar sounds as chips, "View all" for every vanilla
// sound type in a searchable dialog, and a play button to hear each one.
// Custom arrangement of shadcn pieces (Button, Dialog, Input): shadcn has no sound picker.
//
//   Sound                                   [▶]
//   [Stone] [Wood] [Gravel] [Grass]
//   [Sand]  [Wool] [Glass]  [Metal]
//   View all 122 sounds
//
// Sounds play from the player's own Minecraft download (never bundled, rule 2.2.10).
import { Check, Play, Search } from "lucide-react"
import { useState } from "react"
import {
  Button, cn, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Input, toast, Tooltip, TooltipContent, TooltipTrigger,
} from "@blocksy/ui"
import { COMMON_SOUNDS, SOUNDS } from "./options.ts"

type Sound = (typeof SOUNDS)[number]
type Kind = "break" | "step" | "place"

interface SoundPickerProps {
  value: string
  onChange(id: string): void
  playSound?(event: string): Promise<boolean>
}

/** Plays one of a sound type's events, with a friendly note when sounds aren't downloaded yet. */
async function play(sound: Sound | undefined, kind: Kind, playSound?: SoundPickerProps["playSound"]) {
  if (!sound || !playSound) return
  const ok = await playSound(sound.events[kind])
  if (!ok) toast("Build a project once to hear sounds: Blocksy plays the ones Minecraft downloads.", { id: "no-sounds" })
}

function PlayButton({ sound, kind = "break", playSound, label }: { sound: Sound | undefined; kind?: Kind; playSound?: SoundPickerProps["playSound"]; label?: string }) {
  if (!playSound) return null
  const text = label ?? `Hear ${sound?.label.toLowerCase()} (${kind})`
  return (
    <Tooltip>
      <TooltipTrigger
        render={<Button variant="ghost" size="icon-xs" aria-label={text} className="text-fg-muted active:scale-90" onClick={() => void play(sound, kind, playSound)} />}
      >
        <Play className="fill-current" strokeWidth={0} />
      </TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  )
}

export function SoundPicker({ value, onChange, playSound }: SoundPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const current = SOUNDS.find((s) => s.id === value)
  // The familiar ones, plus the current sound when it isn't one of them.
  const chips = [...COMMON_SOUNDS.map((id) => SOUNDS.find((s) => s.id === id)!), ...(current && !(COMMON_SOUNDS as readonly string[]).includes(current.id) ? [current] : [])]
  const choose = (sound: Sound) => {
    onChange(sound.id)
    void play(sound, "place", playSound) // hear it as you pick it
  }
  const q = query.trim().toLowerCase()
  const shown = SOUNDS.filter((s) => !q || s.label.toLowerCase().includes(q) || s.id.includes(q.replaceAll(" ", "_")))

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1">
        {chips.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={s.id === value}
            onClick={() => choose(s)}
            className={cn(
              "h-7 rounded-md px-2 text-sm text-fg-muted transition-[background-color,transform] duration-150 ease-out hover:bg-surface-hover active:scale-95",
              s.id === value ? "bg-surface-pressed text-fg" : "bg-surface",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      {playSound && (
        <div className="flex items-center gap-0.5 text-xs text-fg-muted">
          <span className="mr-1">Hear it</span>
          {(["break", "step", "place"] as const).map((kind) => (
            <Button key={kind} variant="ghost" size="xs" className="gap-1 px-1.5 text-fg-muted active:scale-95" onClick={() => void play(current, kind, playSound)}>
              <Play className="size-2.5 fill-current" strokeWidth={0} />
              {kind[0]!.toUpperCase() + kind.slice(1)}
            </Button>
          ))}
        </div>
      )}
      <Button variant="ghost" size="sm" className="-ml-1.5 self-start px-1.5 text-fg-muted" onClick={() => setOpen(true)}>
        View all {SOUNDS.length} sounds
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[min(80vh,640px)] max-w-lg flex-col gap-3">
          <DialogHeader>
            <DialogTitle>Block sounds</DialogTitle>
            <DialogDescription>Every sound type in Minecraft. Press play to hear it broken; click a name to use it.</DialogDescription>
          </DialogHeader>
          <label className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-fg-faint" strokeWidth={2} />
            <Input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search sounds" aria-label="Search sounds" className="h-8 pl-8" />
          </label>
          <div className="-mx-1 grid min-h-0 grid-cols-2 gap-0.5 overflow-y-auto px-1">
            {shown.map((s) => (
              <div key={s.id} className={cn("flex items-center gap-1 rounded-md pr-1 pl-0.5", s.id === value && "bg-surface")}>
                <PlayButton sound={s} playSound={playSound} />
                <button
                  type="button"
                  className="flex h-8 min-w-0 flex-1 items-center gap-1.5 truncate text-left text-sm text-fg"
                  onClick={() => {
                    choose(s)
                    setOpen(false)
                  }}
                >
                  <span className="truncate">{s.label}</span>
                  {s.id === value && <Check className="size-3.5 shrink-0 text-brand" strokeWidth={2.5} />}
                </button>
              </div>
            ))}
            {shown.length === 0 && <p className="col-span-2 py-6 text-center text-sm text-fg-muted">No sound called “{query}”.</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
