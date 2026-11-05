// Adding, duplicating, renaming and deleting elements of the open project.
// Used by the tree, its context menu, the menu bar and the palette, so every road
// goes through the same document commands (undo and redo just work).
import { addElement, deriveElementId, removeElement, renameElement, type Element } from "@blocksy/core"
import { elementModules } from "../app/modules"
import { useEditor } from "./stores/editor"
import { useProject } from "./stores/project"

/** Creates an element from a typed name and opens it in a tab. Returns its id, or null. */
export function createElement(typeId: string, typed: string): string | null {
  const project = useProject.getState().current
  const module = elementModules.get(typeId)
  const name = typed.trim()
  if (!project || !module || !name) return null
  const { doc, documents } = project
  const id = deriveElementId(name, doc.elements.map((e) => e.id))
  const data = module.create ? module.create(doc) : module.type.defaults()
  documents.execute(addElement({ id, type: typeId, name, data }))
  useEditor.getState().select(id)
  return id
}

/** Like createElement, with the element's data already set (an import brings its texture along). */
export function createElementWith(typeId: string, typed: string, data: unknown): string | null {
  const project = useProject.getState().current
  const name = typed.trim()
  if (!project || !elementModules.has(typeId) || !name) return null
  const { doc, documents } = project
  const id = deriveElementId(name, doc.elements.map((e) => e.id))
  documents.execute(addElement({ id, type: typeId, name, data }))
  useEditor.getState().select(id)
  return id
}

/** Copies an element ("Ruby Block copy") and opens the copy. */
export function duplicateElement(element: Element): string | null {
  const project = useProject.getState().current
  if (!project) return null
  const { doc, documents } = project
  const name = `${element.name} copy`
  const id = deriveElementId(name, doc.elements.map((e) => e.id))
  documents.execute(addElement({ id, type: element.type, name, data: structuredClone(element.data) }))
  useEditor.getState().select(id)
  return id
}

export function renameElementTo(element: Element, typed: string) {
  const name = typed.trim()
  const project = useProject.getState().current
  if (!project || !name || name === element.name) return
  project.documents.execute(renameElement(element.id, name))
}

/** Deletes an element; its tab closes (Ctrl+Z brings the element back, the tab stays closed). */
export function deleteElement(element: Element) {
  const project = useProject.getState().current
  if (!project) return
  project.documents.execute(removeElement(element.id))
  useEditor.getState().closeTab(element.id) // falls back to a neighbour tab, or Overview
}

/** The element showing in the editor right now, if the selection is an element. */
export function selectedElement(): Element | undefined {
  const project = useProject.getState().current
  const selected = useEditor.getState().selected
  return project?.doc.elements.find((e) => e.id === selected)
}
