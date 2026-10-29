# Testing the auto-updater (0.1.0 → 0.1.1)

The v0.1 "Done when" includes: *an installed 0.1.0 updates itself to a test 0.1.1 release*.
This needs your signing key and two GitHub releases, so it is a manual, one-time check.

## Once: set up signing

1. `pnpm updater:keygen` — choose a password when asked and save it in your password manager.
2. Commit the public key it wrote into `apps/desktop/src-tauri/tauri.conf.json`.
3. Add the two secrets it prints (`gh secret set ...`).
4. Back up `.private/updater/blocksy-updater.key` outside this computer.

## Release 0.1.0 and install it

1. Run `/release` in Claude Code (checks, changelog, tag `v0.1.0`).
2. `pnpm release` → confirm the push. The **Release** Action builds a draft.
3. When the Action is green, open the draft on GitHub's Releases page, check that
   `latest.json` and the installers are attached, and **publish** it.
4. Install Blocksy from the published Windows installer and open it once.

## Release 0.1.1

1. Make a tiny visible change on a branch (e.g. a word on the Docs page), merge it to `main`.
2. `/release` (it picks 0.1.1 as a patch), then `pnpm release`, then publish the draft.

## Watch it update

1. Open the installed 0.1.0. About 8 seconds after start it checks GitHub.
2. The status bar shows **“Blocksy 0.1.1 is ready · Restart to update”**.
3. Start a Build: the button is disabled with “Waits until the build or game has finished”.
4. When the build ends, press it. Blocksy restarts; Settings → Updates shows **Blocksy 0.1.1**.

Record the result (date, versions, anything odd) in `docs/perf/0.1.md` under “Updater check”.
