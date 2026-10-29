// A tiny typed event bus. Features talk through events instead of importing
// each other: one side emits "projectOpened", any number of others listen.

export interface EventBus<Events extends Record<string, unknown>> {
  on<K extends keyof Events>(name: K, listener: (payload: Events[K]) => void): () => void
  emit<K extends keyof Events>(name: K, payload: Events[K]): void
}

export function createEventBus<Events extends Record<string, unknown>>(): EventBus<Events> {
  const listeners = new Map<keyof Events, Set<(payload: never) => void>>()

  return {
    on(name, listener) {
      const set = listeners.get(name) ?? new Set()
      set.add(listener as (payload: never) => void)
      listeners.set(name, set)
      return () => set.delete(listener as (payload: never) => void)
    },
    emit(name, payload) {
      listeners.get(name)?.forEach((listener) => (listener as (p: typeof payload) => void)(payload))
    },
  }
}
