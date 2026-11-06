// The Learn lessons, in order (the same list as content/learn/meta.json). The welcome window's
// Learn view lists these without loading the whole Docs app; clicking one opens its page.
// A test in apps/desktop keeps this list equal to the lesson files (slug, title, description),
// so a new lesson that isn't listed here fails the tests.

export interface Lesson {
  /** The file name in content/learn, and the last part of its path. */
  slug: string
  title: string
  /** The one-line description from the lesson's frontmatter. */
  about: string
}

export const LESSONS: Lesson[] = [
  {
    slug: "make-your-first-block",
    title: "Make your first block",
    about: "A textured block in its own creative tab that you can place, and that drops itself when mined with a pickaxe.",
  },
  {
    slug: "make-your-first-item",
    title: "Make your first item",
    about: "Paint an item, craft it, cook it in a furnace and eat it for a burst of speed.",
  },
]

/** The Docs path of a lesson. */
export const lessonPath = (slug: string) => `/docs/learn/${slug}`
