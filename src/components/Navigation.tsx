import Link from "next/link";

const LINKS = [
  { href: "/", label: "Início" },
  { href: "/classificacao", label: "Classificação" },
  { href: "/calendario", label: "Calendário" },
  { href: "/ao-vivo", label: "Ao Vivo" },
];

export function Navigation() {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-0 left-0 right-0 z-10 flex justify-around border-t border-line bg-surface/95 py-2 backdrop-blur md:static md:justify-start md:gap-2 md:border-b md:border-t-0 md:border-line md:bg-transparent md:px-0 md:py-4"
    >
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-muted transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 md:border-b-2 md:border-transparent md:pb-3 md:hover:border-accent"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
