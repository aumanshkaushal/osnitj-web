"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"

type NavItem = {
  label: string
  href: string
}

export function NavMenu({ items }: { items: NavItem[] }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative w-full lg:w-auto">
      {/* Desktop nav */}
      <nav className="hidden lg:flex items-center justify-start gap-x-4 flex-wrap font-mono text-[11px] uppercase tracking-[0.18em]">
        {items.map((n) => (
          <a
            key={n.label}
            href={n.href}
            className="hover:text-[#C85A41] transition-colors"
          >
            {n.label}
          </a>
        ))}
      </nav>

      {/* Mobile/Tablet hamburger */}
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="lg:hidden flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.22em] hover:text-[#C85A41] transition-colors"
        aria-label="Toggle menu"
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
      >
        {isOpen ? (
          <X className="size-4" strokeWidth={1.5} />
        ) : (
          <Menu className="size-4" strokeWidth={1.5} />
        )}
        <span>{isOpen ? "Close" : "Menu"}</span>
      </button>

      {/* Mobile/Tablet dropdown menu */}
      {isOpen && (
        <div
          id="mobile-navigation"
          className="lg:hidden absolute top-full left-0 right-0 mt-4 bg-[#F7F7F2] dark:bg-[#121212] border-y border-black/15 dark:border-white/15 z-50"
        >
          <nav className="flex flex-col divide-y divide-black/15 dark:divide-white/15 font-mono text-[11px] uppercase tracking-[0.22em]">
            {items.map((n) => (
              <a
                key={n.label}
                href={n.href}
                onClick={() => setIsOpen(false)}
                className="px-4 md:px-8 py-4 hover:text-[#C85A41] transition-colors"
              >
                {n.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </div>
  )
}
