// A registry is a named list of modules, looked up by id.
// Every extensible part of Blocksy (element types, themes, loader targets, ...)
// is one registry, so adding a new kind of thing is one `register(...)` call.

export interface Registry<T extends { id: string }> {
  /** Which registry this is, used in error messages ("element type"). */
  readonly kind: string
  /** Adds a module. Throws if the id is already taken, so mistakes show early. */
  register(module: T): T
  /** Returns the module with this id, or undefined. */
  get(id: string): T | undefined
  /** Returns the module with this id, or throws a clear error. */
  require(id: string): T
  /** Every module, in registration order. */
  list(): T[]
}

export function createRegistry<T extends { id: string }>(kind: string): Registry<T> {
  const modules = new Map<string, T>()

  return {
    kind,
    register(module) {
      if (modules.has(module.id)) {
        throw new Error(`A ${kind} with id "${module.id}" is already registered`)
      }
      modules.set(module.id, module)
      return module
    },
    get: (id) => modules.get(id),
    require(id) {
      const module = modules.get(id)
      if (!module) throw new Error(`Unknown ${kind} "${id}"`)
      return module
    },
    list: () => [...modules.values()],
  }
}
