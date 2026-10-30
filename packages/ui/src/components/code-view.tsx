// CodeView: read-only, highlighted code with line numbers (the project editor's Code tab).
// A thin Blocksy adapter over Shiki (plan rule 6): features use <CodeView>, never Shiki,
// so the highlighter can be swapped without touching them. shadcn has no code viewer.
// Colours come from theme tokens through Shiki's css-variables theme (styles.css).
import { useEffect, useState } from "react"
import type { HighlighterCore } from "shiki/core"
import { cn } from "../lib/utils.ts"

export type CodeLanguage = "java" | "json" | "groovy" | "properties" | "text"

/** Picks a language from a file name ("ModBlocks.java" -> "java"). */
export function languageOf(path: string): CodeLanguage {
  if (path.endsWith(".java")) return "java"
  if (path.endsWith(".json")) return "json"
  if (path.endsWith(".gradle")) return "groovy"
  if (path.endsWith(".properties")) return "properties"
  return "text"
}

// One highlighter for the whole app, loaded the first time code is shown (keeps start-up fast).
let highlighter: Promise<HighlighterCore> | null = null
function loadHighlighter() {
  highlighter ??= (async () => {
    const [{ createHighlighterCore, createCssVariablesTheme }, { createJavaScriptRegexEngine }] = await Promise.all([
      import("shiki/core"),
      import("shiki/engine/javascript"),
    ])
    return createHighlighterCore({
      themes: [createCssVariablesTheme({ name: "blocksy", variablePrefix: "--shiki-" })],
      langs: [import("shiki/langs/java.mjs"), import("shiki/langs/json.mjs"), import("shiki/langs/groovy.mjs"), import("shiki/langs/properties.mjs")],
      engine: createJavaScriptRegexEngine(),
    })
  })()
  return highlighter
}

interface Token {
  content: string
  color?: string
}

export function CodeView({ code, language, className }: { code: string; language: CodeLanguage; className?: string }) {
  const [lines, setLines] = useState<Token[][] | null>(null)

  useEffect(() => {
    let alive = true
    if (language === "text") {
      setLines(code.split("\n").map((content) => [{ content }]))
      return
    }
    void loadHighlighter().then((h) => {
      if (!alive) return
      const { tokens } = h.codeToTokens(code, { lang: language, theme: "blocksy" })
      setLines(tokens.map((line) => line.map((t) => ({ content: t.content, color: t.color }))))
    })
    return () => {
      alive = false
    }
  }, [code, language])

  // Until highlighting is ready, show the plain text (no layout jump).
  const shown: Token[][] = lines ?? code.split("\n").map((content) => [{ content }])
  // A trailing newline would draw an empty last line.
  if (shown.length > 1 && shown.at(-1)!.every((t) => t.content === "")) shown.pop()

  return (
    <pre data-selectable className={cn("overflow-auto font-mono text-xs leading-5 text-fg", className)}>
      <code className="grid grid-cols-[auto_1fr]">
        {shown.map((line, i) => (
          <span key={i} className="contents">
            <span className="pr-4 text-right text-fg-faint tabular-nums select-none">{i + 1}</span>
            <span className="pr-6 whitespace-pre">
              {line.map((t, j) => (
                <span key={j} style={t.color ? { color: t.color } : undefined}>
                  {t.content}
                </span>
              ))}
            </span>
          </span>
        ))}
      </code>
    </pre>
  )
}
