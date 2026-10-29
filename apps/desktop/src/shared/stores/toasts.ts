// Short, quiet notifications in the bottom-right corner ("Saved my_mod-1.0.0.jar").
import { create } from "zustand"

export interface Toast {
  id: number
  message: string
  tone: "neutral" | "error"
  action?: { label: string; run(): void }
}

interface ToastState {
  toasts: Toast[]
  show(toast: Omit<Toast, "id" | "tone"> & { tone?: Toast["tone"] }): void
  dismiss(id: number): void
}

let nextId = 1

export const useToasts = create<ToastState>((set, get) => ({
  toasts: [],
  show(toast) {
    const id = nextId++
    const next: Toast = { tone: "neutral", ...toast, id }
    set({ toasts: [...get().toasts, next].slice(-3) })
    setTimeout(() => get().dismiss(id), toast.tone === "error" ? 8000 : 5000)
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}))
