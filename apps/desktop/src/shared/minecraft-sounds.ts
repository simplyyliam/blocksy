// Plays vanilla sound events ("block.wood.break") in the editor, using the sounds Minecraft
// already downloaded on this computer (Blocksy never ships them, plan rule 2.2.10).
//
//   event "block.wood.break"  --sounds.json-->  ["dig/wood1", "dig/wood2", ...]
//   pick one at random       --asset cache-->  minecraft/sounds/dig/wood3.ogg  --> <audio>
//
// The webview plays Ogg Vorbis natively, so no conversion is needed. Files are cached in
// memory after the first play. Elements get this as ElementEditorProps.playSound.
import { commands } from "./bindings"
import { call } from "./api"

interface SoundEntry {
  name: string
  type?: "file" | "event"
  volume?: number
  pitch?: number
}

type SoundsJson = Record<string, { sounds: (string | SoundEntry)[] }>

let soundsJson: Promise<SoundsJson> | null = null
const files = new Map<string, Promise<string>>()

async function readAsset(path: string): Promise<string> {
  return call(commands.readMinecraftAsset(path))
}

function loadSoundsJson(): Promise<SoundsJson> {
  soundsJson ??= readAsset("minecraft/sounds.json").then((b64) => JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)))) as SoundsJson)
  // A failed load (nothing downloaded yet) may succeed after the first build: try again next time.
  soundsJson.catch(() => (soundsJson = null))
  return soundsJson
}

/** One concrete sound file for an event, following "event" references (max 4 deep). */
function pick(json: SoundsJson, event: string, depth = 0): SoundEntry | null {
  const list = json[event.replace(/^minecraft:/, "")]?.sounds
  if (!list?.length || depth > 4) return null
  const raw = list[Math.floor(Math.random() * list.length)]!
  const entry = typeof raw === "string" ? { name: raw } : raw
  return entry.type === "event" ? pick(json, entry.name, depth + 1) : entry
}

/** Plays a vanilla sound event. Resolves false when Minecraft's sounds aren't on this computer yet. */
export async function playMinecraftSound(event: string): Promise<boolean> {
  try {
    const entry = pick(await loadSoundsJson(), event)
    if (!entry) return false
    const path = `minecraft/sounds/${entry.name.replace(/^minecraft:/, "")}.ogg`
    if (!files.has(path)) {
      const url = readAsset(path).then((b64) => URL.createObjectURL(new Blob([Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))], { type: "audio/ogg" })))
      url.catch(() => files.delete(path))
      files.set(path, url)
    }
    const audio = new Audio(await files.get(path)!)
    audio.volume = Math.min(1, Math.max(0, (entry.volume ?? 1) * 0.8))
    audio.preservesPitch = false
    audio.playbackRate = entry.pitch ?? 1
    await audio.play()
    return true
  } catch {
    return false
  }
}
