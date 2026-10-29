import { describe, expect, it, vi } from "vitest"
import { createDocumentStore } from "./commands.ts"
import { createEventBus } from "./events.ts"
import { createProject } from "./project.ts"
import { addElement, renameProject } from "./project-commands.ts"

const project = () => createProject({ name: "Start", target: "fabric", minecraftVersion: "26.1.2" })

describe("commands with undo/redo", () => {
  it("undoes and redoes edits in order", () => {
    const store = createDocumentStore(project())
    store.execute(renameProject("First"))
    store.execute(addElement({ id: "e1", type: "dummy", name: "Thing", data: {} }))

    expect(store.undoLabel()).toBe("Add Thing")
    store.undo()
    expect(store.get().elements).toHaveLength(0)
    store.undo()
    expect(store.get().name).toBe("Start")
    expect(store.canUndo()).toBe(false)

    store.redo()
    expect(store.get().name).toBe("First")
  })

  it("drops the redo branch after a new edit and skips no-op commands", () => {
    const store = createDocumentStore(project())
    store.execute(renameProject("A"))
    store.undo()
    store.execute(renameProject("B"))
    expect(store.canRedo()).toBe(false)

    const before = store.get()
    store.execute(renameProject("B")) // same name: nothing to undo
    expect(store.get()).toBe(before)
  })

  it("notifies subscribers and never mutates old snapshots", () => {
    const store = createDocumentStore(project())
    const listener = vi.fn()
    store.subscribe(listener)
    const original = store.get()
    store.execute(renameProject("Changed"))
    expect(listener).toHaveBeenCalledOnce()
    expect(original.name).toBe("Start")
  })
})

describe("event bus", () => {
  it("delivers typed events until unsubscribed", () => {
    const bus = createEventBus<{ saved: { path: string } }>()
    const seen: string[] = []
    const off = bus.on("saved", ({ path }) => seen.push(path))
    bus.emit("saved", { path: "a" })
    off()
    bus.emit("saved", { path: "b" })
    expect(seen).toEqual(["a"])
  })
})
