---
description: Prepare a Blocksy release (checks, version bump, changelog, annotated tag). Never pushes.
argument-hint: '[notes, e.g. "known issue: …"]'
---

Prepare the next Blocksy release on `main`. You prepare it locally; the user tests it and publishes it with `pnpm release`. Never push, never run `pnpm release`, never launch the app.

Notes from the user (may be empty): $ARGUMENTS
Use them in the changelog (a "known issue: …" goes under Known issues, anything else where it fits). If a note asks for something other than changelog content, do it only if it fits the steps below; otherwise ask.

Stop and report at the first step that fails. Don't fix code as part of a release.

Paths: the repo is a pnpm-workspaces monorepo. The Tauri app is `apps/desktop/`, its Rust side `apps/desktop/src-tauri/`, and the generated bindings `apps/desktop/src/shared/bindings.ts`. The plan is `docs/release/blocksy-release-plan.md`.

## 1. Check main

- On `main`, with a clean working tree (`git status --porcelain` empty, untracked files included). Otherwise stop.
- `.private/` must be ignored: `git check-ignore -q .private/updater/blocksy-updater.key` must succeed, and `git ls-files .private` must print nothing. Otherwise stop: the signing key could be committed.
- Run every check and stop if any fails:
  - in `apps/desktop/src-tauri/`: `cargo check`, `cargo clippy --all-targets`, `cargo test`
  - in the root: `pnpm typecheck`, `pnpm build`, `pnpm lint`, `pnpm test`
- Clippy or lint warnings don't fail the build: list them and ask whether to go on.
- `cargo test` regenerates `apps/desktop/src/shared/bindings.ts`. If any check leaves the tree dirty, stop: the bindings or generated files were out of date and need their own commit first.

## 2. Pick the version

- Last release: `git describe --tags --abbrev=0 --match 'v*'`. Changes: `git log --oneline <last tag>..HEAD` (read the bodies too, and merges' branches). No commits since the tag: stop, there's nothing to release.
- Versions follow the plan (section 2.6 of `docs/release/blocksy-release-plan.md`):
  - **Minor** (0.4.x → 0.5.0) when these commits complete plan release 0.5: its "Done when" test and its catalog items (section 3). Check the plan and say which items you saw done.
  - **Patch** (0.5.0 → 0.5.1) when they only fix bugs or polish what's already released.
  - Work toward the next plan release that isn't complete yet: ask whether to release it as a patch or wait.
  - Only docs, chores or refactors: ask whether to release at all.
- A minor release also needs `docs/perf/0.N.md` from the bench on the reference machine, with no regression over 10% (section 4). Missing or failing: stop and ask.
- Say which version and why, naming the commits that decided it.
- If the tag `vX.Y.Z` already exists (locally or on origin, `git ls-remote --tags origin`), stop.

## 3. Bump the version

- `apps/desktop/src-tauri/tauri.conf.json` (`version`), `apps/desktop/src-tauri/Cargo.toml` (`[package] version`), `apps/desktop/package.json` (`version`), and the root `package.json` (`version`).
- Run `cargo check` in `apps/desktop/src-tauri/` again so `Cargo.lock` picks up the new version.
- Commit those files and `Cargo.lock`: `chore(release): vX.Y.Z`.
- Already at X.Y.Z (a release prepared again after a fix): skip this step.

## 4. Changelog

Add a section at the top of `CHANGELOG.md` (below the intro), in the style of the sections already there:

```
## [X.Y.Z] - YYYY-MM-DD

One plain sentence: what this release is about.

### Added
### Changed
### Fixed
### Known issues
### Privacy
```

- Today's date. Leave out Added, Changed or Fixed when there's nothing for them.
- Plain language for people who make mods with Blocksy, not for developers: what they'll notice, in Blocksy's voice. No file names, function names, commit hashes or jargon. Bold the lead of the big items, as in earlier sections.
- If a project format migration ships in this release, say so plainly under Changed (for example "Projects are upgraded automatically when you open them").
- **Known issues** (at most 8): start from the previous release's list. Drop the ones this release fixes, update the ones that changed, add new ones and the user's notes. Over 8: merge related ones or keep the ones that matter most. While the installer isn't code-signed, always keep the SmartScreen item ("More info", then "Run anyway"): the release notes only explain it there.
- **Privacy**: what Blocksy sends to whom. Carry over what's still true and add anything new. At least: update checks to GitHub; GitHub sign-in and sync when the user connects GitHub; Minecraft, Fabric and library downloads from Mojang, Fabric and Maven repositories during builds; links the user opens from Docs.
- The GitHub release body is this section, so it must read well on its own.
- Commit: `docs: add changelog for vX.Y.Z`. If the section already exists (prepared again after a fix), update it instead and commit `docs: update changelog for vX.Y.Z`.

## 5. Tag

- Annotated, on that commit: `git tag -a vX.Y.Z -m "Blocksy X.Y.Z: <the section's sentence, shortened>"`.
- Never push the commits or the tag.

## 6. Report

- Write `.private/releases/vX.Y.Z-report.md`: the version and why, the checks that ran, the changelog section, and `git log --oneline <last tag>..HEAD`.

## 7. Finish

Show the version, the changelog section and `git log --oneline <last tag>..HEAD`, then tell the user:

1. **Test the app** from this commit, including opening a project made with the previous version.
2. **Run `pnpm release`**: it checks main and the tag again, shows what goes out, asks before pushing main and the tag, and the tag starts the GitHub Action that builds the installers and the signed update.
3. **Publish the draft** on GitHub's Releases page once the Action is done and the installers work. Publishing is what makes installed copies update.

If something needs fixing before it's pushed: `git tag -d vX.Y.Z`, fix it on main, and run /release again.
