# 14. v1.0.0: the real test

v1.0.0 ships when all three tests pass inside Blocksy with no hand-edited files outside it, on the reference machine, within the performance budget. Custom code nodes are allowed for the full mod.

**Test 1: a block** (target: under 15 minutes for a first-time user)
- [ ] Custom texture and model with a facing state
- [ ] Correct tool and hardness; drops itself
- [ ] Recipe and creative tab; translated name; zero Problems

**Test 2: an item**
- [ ] Texture from the texture editor
- [ ] Recipe plus node-based behaviour (for example a right-click ability with a cooldown)
- [ ] Tooltip and lang entry

**Test 3: a full mod, an Aetheric Storage Engineering slice**
- [ ] An ore with worldgen, plus raw and refined items, and a full block set from the refined material
- [ ] A tool and armor set from the new material
- [ ] Two machines powered by energy, with GUI Studio screens (one vanilla-style, one fully custom) and a custom recipe type
- [ ] A storage item that carries data, shown in its tooltip
- [ ] A small multiblock with cables connecting the machines
- [ ] An animated entity made in Model Studio (for example a storage drone)
- [ ] Recipes visible in a recipe viewer
- [ ] An advancement chain guiding progression
- [ ] Config screen and mod icon
- [ ] Pushed to GitHub; release jar runs in a normal Fabric install and on a dedicated server
- [ ] The whole project works and looks right in both app themes

```text
/goal Ship Blocksy v1.0.0 by passing three acceptance tests, building everything inside Blocksy with no hand-edited files outside it. Read docs/release/plan/ sections 3, 4 and 14.
Test 1 (block): custom texture and model with a facing state, correct tool and hardness, drops itself, recipe, creative tab, translated name, zero Problems.
Test 2 (item): texture from the texture editor, recipe, node-based right-click ability with a cooldown, tooltip and lang entry.
Test 3 (full mod, an Aetheric Storage Engineering slice): ore with worldgen, its items and a full block set; tool and armor set; two energy-powered machines with GUI Studio screens (one vanilla-style, one fully custom) and a custom recipe type; a data-carrying storage item; a small multiblock with cables; an animated entity made in Model Studio; recipes visible in a recipe viewer; an advancement chain; config screen and icon; pushed to GitHub; release jar running in a normal Fabric install and on a dedicated server.
For every gap a test exposes, fix Blocksy itself (never the test project), log each fix, and confirm no fix required refactoring an earlier module; if one did, write an ADR. Run the full bench and record docs/perf/1.0.0.md.
Done when: all three tests pass from a fresh install of Blocksy on the reference machine within every section 4 budget.
Keep CHECKPOINT.md current as you go (same shape as earlier releases: done table, still to do, useful facts), so a new session can pick up where the last one stopped.
Before finishing: run /code-review and /security-review on the release branch and fix what they find, and run the end-to-end test (create a project in the real app, Build, Run, and check the release's "Done when" in game).
End with STATUS / CHECKS / NEEDS YOUR DECISION.
```
