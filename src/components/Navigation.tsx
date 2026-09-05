"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Início" },
  { href: "/classificacao", label: "Classificação" },
  { href: "/calendario", label: "Calendário" },
  { href: "/circuitos", label: "Circuitos" },
  { href: "/ao-vivo", label: "Ao Vivo" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-0 left-0 right-0 z-10 flex justify-around border-t border-line bg-surface/95 py-2 backdrop-blur md:static md:justify-start md:gap-2 md:border-b md:border-t-0 md:border-line md:bg-transparent md:px-0 md:py-4"
    >
      {LINKS.map((link) => {
        // "/circuitos" also covers its detail route (/circuitos/[id]); the
        // other links here have no sub-routes, so an exact match is enough.
        const isActive = link.href === "/circuitos" ? pathname.startsWith(link.href) : pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={`rounded border-t-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 md:border-t-0 md:border-b-2 md:pb-3 ${
              isActive
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-foreground focus-visible:text-foreground md:hover:border-accent"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
