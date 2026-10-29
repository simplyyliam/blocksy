// The command system: the only way editors change a document.
// A command is a named, pure function `old document -> new document`.
// Because documents are never mutated, undo is just "go back to the previous
// snapshot", and redo is "go forward again". No per-command undo code needed.

export interface Command<D> {
  /** Shown in menus and history ("Rename project"). */
  label: string
  run(doc: D): D
}

export interface DocumentStore<D> {
  get(): D
  execute(command: Command<D>): void
  undo(): void
  redo(): void
  canUndo(): boolean
  canRedo(): boolean
  /** Label of the command that undo would revert, for "Undo Rename project". */
  undoLabel(): string | undefined
  /** Called after every change. Returns a function that unsubscribes. */
  subscribe(listener: (doc: D) => void): () => void
}

interface Entry<D> {
  doc: D
  label: string
}

export function createDocumentStore<D>(initial: D, options: { limit?: number } = {}): DocumentStore<D> {
  const limit = options.limit ?? 200
  let current = initial
  const past: Entry<D>[] = []
  const future: Entry<D>[] = []
  const listeners = new Set<(doc: D) => void>()

  const notify = () => listeners.forEach((listener) => listener(current))

  return {
    get: () => current,
    execute(command) {
      const next = command.run(current)
      if (next === current) return // nothing changed, nothing to undo
      past.push({ doc: current, label: command.label })
      if (past.length > limit) past.shift()
      future.length = 0 // a new edit throws away the redo branch
      current = next
      notify()
    },
    undo() {
      const entry = past.pop()
      if (!entry) return
      future.push({ doc: current, label: entry.label })
      current = entry.doc
      notify()
    },
    redo() {
      const entry = future.pop()
      if (!entry) return
      past.push({ doc: current, label: entry.label })
      current = entry.doc
      notify()
    },
    canUndo: () => past.length > 0,
    canRedo: () => future.length > 0,
    undoLabel: () => past.at(-1)?.label,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
