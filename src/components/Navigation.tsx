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
      className="fixed bottom-0 left-0 right-0 z-10 flex justify-around border-t border-surface bg-surface/95 py-2 backdrop-blur md:static md:justify-start md:gap-6 md:border-b md:border-t-0 md:bg-transparent md:px-0 md:py-4"
    >
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="px-2 py-1 text-sm font-semibold text-foreground hover:text-accent"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
