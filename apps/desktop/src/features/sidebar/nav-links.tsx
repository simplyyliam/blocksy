// Home and Docs at the top of the sidebar. The grey highlight slides between rows.
import { BookOpen, House } from "lucide-react"
import { motion } from "motion/react"
import { useNavigation, type Page } from "../../shared/stores/navigation"

const links: { page: Page; label: string; Icon: typeof House }[] = [
  { page: "home", label: "Home", Icon: House },
  { page: "docs", label: "Docs", Icon: BookOpen },
]

export function NavLinks() {
  const page = useNavigation((s) => s.page)
  const go = useNavigation((s) => s.go)
  return (
    <nav className="flex flex-col gap-0.5">
      {links.map(({ page: target, label, Icon }) => (
        <button
          key={target}
          type="button"
          onClick={() => go(target)}
          aria-current={page === target ? "page" : undefined}
          className="relative flex h-7 items-center gap-2 rounded-md px-2 text-base text-fg outline-none transition-colors duration-150 hover:bg-surface/60 focus-visible:shadow-[0_0_0_3px_var(--b-focus)]"
        >
          {page === target && (
            <motion.span
              layoutId="sidebar-highlight"
              className="absolute inset-0 rounded-md bg-surface"
              transition={{ type: "spring", stiffness: 520, damping: 42 }}
            />
          )}
          <Icon className="relative size-3.5" strokeWidth={1.75} />
          <span className="relative">{label}</span>
        </button>
      ))}
    </nav>
  )
}
