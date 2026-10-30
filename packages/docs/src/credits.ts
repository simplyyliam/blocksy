// Credits: everyone whose work Blocksy's Docs and app stand on. One list, shown in
// two places: a short line in every Docs page footer, and the full Credits page.
// Add an entry whenever a tutorial, video, font, library or idea from someone else is used.

export interface Credit {
  name: string
  /** What they made, in a few words. */
  work: string
  /** How Blocksy uses it. */
  usedFor: string
  url: string
  license?: string
  /** Shown in the short footer line. */
  featured?: boolean
}

export interface CreditGroup {
  title: string
  credits: Credit[]
}

export const CREDITS: CreditGroup[] = [
  {
    title: "Teachers",
    credits: [
      {
        name: "Modding by Kaupenjoe (Nico)",
        work: "Fabric Modding Tutorials for Minecraft 1.21",
        usedFor: "The video lessons in “Make your first block” and the Learn section. Watch the full playlist on YouTube.",
        url: "https://www.youtube.com/playlist?list=PLKGarocXCE1H_HxOYihQMq0mlpqiUJj4L",
        featured: true,
      },
      {
        name: "Fabric Documentation team",
        work: "Fabric Documentation and Fabric Wiki",
        usedFor: "The reference Blocksy checks its generated code against (blocks, data generation, creative tabs).",
        url: "https://docs.fabricmc.net/develop/",
      },
    ],
  },
  {
    title: "Docs and design",
    credits: [
      {
        name: "Fumadocs (Fuma Nama and contributors)",
        work: "Fumadocs, the docs framework",
        usedFor: "The whole Docs section: layout, navigation, table of contents and MDX pages.",
        url: "https://www.fumadocs.dev/",
        license: "MIT",
        featured: true,
      },
      {
        name: "Daniele Procida",
        work: "Diátaxis",
        usedFor: "How the Docs are organised: Learn, Guides, Reference and Concepts.",
        url: "https://diataxis.fr/",
        license: "CC BY-SA 4.0",
      },
      {
        name: "Stefie Justprince",
        work: "Pixelify Sans",
        usedFor: "The pixel font of the Minecraft theme.",
        url: "https://fonts.google.com/specimen/Pixelify+Sans",
        license: "SIL Open Font License 1.1",
        featured: true,
      },
      {
        name: "shadcn",
        work: "shadcn/ui",
        usedFor: "Every button, field, menu and dialog in the app.",
        url: "https://ui.shadcn.com/",
        license: "MIT",
      },
      {
        name: "assistant-ui",
        work: "Dot Matrix",
        usedFor: "The little animated status light while building and starting Minecraft.",
        url: "https://www.assistant-ui.com/docs/ui/dot-matrix",
        license: "MIT",
      },
      {
        name: "Magic UI",
        work: "Dot Pattern and Confetti",
        usedFor: "The dot grid behind the block preview and the first-time-in-game celebration.",
        url: "https://magicui.design/",
        license: "MIT",
      },
    ],
  },
  {
    title: "3D and code",
    credits: [
      {
        name: "Poimandres",
        work: "React Three Fiber and drei",
        usedFor: "The live 3D block preview.",
        url: "https://r3f.docs.pmnd.rs/",
        license: "MIT",
      },
      {
        name: "three.js authors",
        work: "three.js",
        usedFor: "Drawing the 3D block preview.",
        url: "https://threejs.org/",
        license: "MIT",
      },
      {
        name: "Shiki (Pine Wu, Anthony Fu and contributors)",
        work: "Shiki",
        usedFor: "Code colours in the Code tab and in the Docs.",
        url: "https://shiki.style/",
        license: "MIT",
      },
      {
        name: "FabricMC",
        work: "Fabric Loader, Fabric API and Loom",
        usedFor: "What every Blocksy mod is built with.",
        url: "https://fabricmc.net/",
        license: "Apache 2.0",
      },
    ],
  },
]

/** The few credits named in every page footer. */
export const FEATURED = CREDITS.flatMap((g) => g.credits).filter((c) => c.featured)

/** Minecraft is a trademark of Mojang; Blocksy is not affiliated. Shown on the Credits page. */
export const DISCLAIMER =
  "Blocksy is not an official Minecraft product and is not approved by or associated with Mojang or Microsoft. " +
  "Blocksy never ships Minecraft's code or art: the Minecraft theme uses original pixel art and an openly licensed font."
