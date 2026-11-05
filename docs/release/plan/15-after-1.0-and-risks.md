# 15. After 1.0 and risks

After 1.0: NeoForge as a second target module, more Minecraft versions with a porting assistant, optional owo-ui or LDLib2 GUI backends, an in-game guidebook, a public add-on API, and community templates, node packs, model packs and GUI themes.

| Risk | What happens | Fallback |
| --- | --- | --- |
| Minecraft updates break templates | Generated code goes stale | Pin one version per release; one small template per node, so porting is a checklist |
| Architecture drift | Features start needing refactors | Definition of done (2.4), lint boundaries, ADRs, audit in 0.13 |
| 3D is slow at 4K on integrated graphics | Model Studio feels laggy | R3F rules (4.2), adaptive pixel ratio, bench on every release |
| GUI Studio or Model Studio scope explodes | 0.9 or 0.11 never ends | Ship the listed set first; extras become modules later |
| Generated Java is unreadable | Learning goal fails | Review generator output every release as if teaching it |
| First build too slow or fails | Beginners quit at step one | Progress screen, cached downloads, plain-language errors (0.1) |
| Node library loses maintenance | Canvas stuck on old code | Graph model owned by Blocksy; library behind an adapter (section 9) |
| Community links rot | Docs feel abandoned | CI link checker and "last checked" dates (11.3) |
| Updater signing key lost or leaked | Installs can't update, or a fake update could be signed | Key outside the repo, password in a password manager and Actions secrets, offline backup |
| An update breaks people's projects | Users lose trust | Project migrations with tests; never install mid-build; changelog Known issues |

**Open question:** is Aetheric Storage Engineering planned for Fabric? If it must be NeoForge, the NeoForge target moves before 1.0. The target-module design makes that a new module, not a rewrite.
