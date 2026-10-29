// pnpm release: pushes a release that /release prepared (plan 2.6).
// Checks main and the tag again, shows what goes out, and asks before pushing.
// Pushing the tag starts the GitHub Action that builds installers and the update.
import { execSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { createInterface } from "node:readline/promises"

const git = (args) => execSync(`git ${args}`, { encoding: "utf8" }).trim()
const fail = (message) => {
  console.error(`\n✗ ${message}\n`)
  process.exit(1)
}

const version = JSON.parse(readFileSync("apps/desktop/src-tauri/tauri.conf.json", "utf8")).version
const tag = `v${version}`

if (git("branch --show-current") !== "main") fail("Switch to main first.")
if (git("status --porcelain")) fail("The working tree isn't clean. Commit or stash first.")
if (git("ls-files .private")) fail(".private/ has tracked files. The signing key must never be pushed.")
if (!git(`tag --list ${tag}`)) fail(`Tag ${tag} doesn't exist. Run /release first.`)
if (git(`rev-list -n 1 ${tag}`) !== git("rev-parse HEAD")) fail(`${tag} doesn't point at HEAD. Run /release again.`)
git("fetch origin --tags --quiet")
if (git(`ls-remote --tags origin ${tag}`)) fail(`${tag} is already on GitHub.`)

const outgoing = git("log --oneline origin/main..HEAD") || "(main is already pushed; only the tag goes out)"
console.log(`\nBlocksy ${version}\n${git(`tag -l --format=%(contents) ${tag}`)}\n\nCommits going out:\n${outgoing}\n`)

const rl = createInterface({ input: process.stdin, output: process.stdout })
const answer = await rl.question(`Push main and ${tag} to origin? [y/N] `)
rl.close()
if (answer.trim().toLowerCase() !== "y") fail("Nothing was pushed.")

execSync("git push origin main", { stdio: "inherit" })
execSync(`git push origin ${tag}`, { stdio: "inherit" })
console.log(`
✓ Pushed. The release Action is building ${tag}:
  https://github.com/simplyyliam/blocksy/actions
When it's done, test the installers, then publish the draft on the Releases page.
Publishing is what makes installed copies update.
`)
