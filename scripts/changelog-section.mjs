// Prints one version's section of CHANGELOG.md (used as the GitHub release body).
//   node scripts/changelog-section.mjs 0.1.0
import { readFileSync } from "node:fs"

const version = process.argv[2]?.replace(/^v/, "")
const text = readFileSync(new URL("../CHANGELOG.md", import.meta.url), "utf8")
const start = text.indexOf(`## [${version}]`)
if (!version || start === -1) {
  console.log(`Blocksy ${version ?? ""}`.trim())
  process.exit(0)
}
const rest = text.slice(start)
const next = rest.indexOf("\n## [", 1)
// Drop the "## [x.y.z] - date" heading: the release already has a title.
console.log((next === -1 ? rest : rest.slice(0, next)).split("\n").slice(1).join("\n").trim())
