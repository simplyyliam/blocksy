// Saves and loads small JSON blobs (settings, recent projects) in the OS app-data folder.
import { commands } from "../bindings"
import { call } from "../api"

export async function loadJson<T>(name: string, fallback: T): Promise<T> {
  try {
    const text = await call(commands.loadAppData(name))
    return text ? { ...fallback, ...JSON.parse(text) } : fallback
  } catch {
    return fallback // a broken file never blocks start-up
  }
}

export const saveJson = (name: string, value: unknown) =>
  call(commands.saveAppData(name, JSON.stringify(value, null, 2)))
