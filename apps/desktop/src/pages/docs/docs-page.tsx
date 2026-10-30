// Docs: the full calm, visual docs arrive in v0.7. Until then, a short start guide.
import { Page } from "../page"

const steps = [
  { title: "Create a project", body: "Home → New project. Blocksy writes a ready-to-build mod with pinned, tested versions." },
  { title: "Build", body: "The first build downloads Minecraft and the mod loader (a few minutes, once). Later builds take seconds." },
  { title: "Run", body: "Opens Minecraft with your mod loaded. The status bar tells you when your mod shows up in the mod list." },
  { title: "Export", body: "Saves your mod as a .jar you can drop into your mods folder or share." },
]

export function DocsPage() {
  return (
    <Page title="Docs" subtitle="Guides, references and live demos arrive in v0.7. Here's how v0.1 works.">
      <ol className="flex flex-col gap-6">
        {steps.map((step, i) => (
          <li key={step.title} className="flex gap-4">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-surface text-xs text-fg-muted tabular-nums">{i + 1}</span>
            <div>
              <p className="text-base text-fg">{step.title}</p>
              <p className="mt-1 text-base text-fg-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </Page>
  )
}
