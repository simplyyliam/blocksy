// Commands that edit a project. Each returns a new project, never mutating the old one.
import type { Command } from "./commands.ts"
import type { Element, Project } from "./project.ts"

export const renameProject = (name: string): Command<Project> => ({
  label: "Rename project",
  run: (p) => (p.name === name ? p : { ...p, name }),
})

export const addElement = (element: Element): Command<Project> => ({
  label: `Add ${element.name}`,
  run: (p) => ({ ...p, elements: [...p.elements, element] }),
})

export const removeElement = (id: string): Command<Project> => ({
  label: "Remove element",
  run: (p) => ({ ...p, elements: p.elements.filter((e) => e.id !== id) }),
})

export const updateElement = (id: string, data: unknown): Command<Project> => ({
  label: "Edit element",
  run: (p) => ({ ...p, elements: p.elements.map((e) => (e.id === id ? { ...e, data } : e)) }),
})

export const renameElement = (id: string, name: string): Command<Project> => ({
  label: "Rename element",
  run: (p) => ({ ...p, elements: p.elements.map((e) => (e.id === id && e.name !== name ? { ...e, name } : e)) }),
})
