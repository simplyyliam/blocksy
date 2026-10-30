// A Reference page generated from an element type's own docs data (plan 11.2:
// "Reference pages are generated, so they never drift"). Same labels and Java hints
// as the element's editor panel.
import type { ElementType } from "@blocksy/core"
import { BlockDemo } from "./block-demo.tsx"

export function ElementReference({ type }: { type: ElementType }) {
  const docs = type.docs
  if (!docs) return <p>No reference yet.</p>
  return (
    <>
      {type.id === "block" && <BlockDemo caption="A block made with Blocksy's starter texture. Drag to turn it." />}
      <p>{docs.summary}</p>
      <h2 id="fields">Fields</h2>
      <div className="not-prose overflow-hidden rounded-xl shadow-[inset_0_0_0_1px_var(--color-fd-border)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-fd-muted text-xs text-fd-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-medium">Field</th>
              <th className="px-4 py-2 font-medium">What it does</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fd-border">
            {docs.fields.map((f) => (
              <tr key={f.key} className="align-top">
                <td className="px-4 py-3 whitespace-nowrap text-fd-foreground">{f.label}</td>
                <td className="px-4 py-3 text-fd-muted-foreground">
                  {f.description}
                  {f.java && <code className="mt-1.5 block font-mono text-xs text-fd-foreground">{f.java}</code>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 id="in-blocksy">In Blocksy</h2>
      <p>
        Add a {type.name.toLowerCase()} with the <strong>+</strong> next to {type.plural ?? type.name} in the project tree, then edit it in the inspector on
        the right. Switch to <strong>Code</strong> at the bottom to read the Java Blocksy writes.
      </p>
    </>
  )
}
