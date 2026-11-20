import Link from "next/link";
import { Brand } from "@/components/brand";
import { buttonStyles } from "@/components/ui/button";

const entries = [
  ["funcionalidades", "Funcionalidades"],
  ["como-funciona", "Como funciona"],
  ["faq", "Perguntas frequentes"],
];

function SiteNavigation({ className }: { className: string }) {
  return (
    <nav aria-label="Navegação principal" className={className}>
      {entries.map(([id, label]) => (
        <Link
          key={id}
          className="whitespace-nowrap hover:text-primary"
          href={`/#${id}`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex min-h-18 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
        <Link href="/" aria-label="ClinicFlow, início">
          <Brand />
        </Link>
        <SiteNavigation className="hidden items-center gap-8 text-sm font-medium text-muted lg:flex" />
        <div className="flex items-center gap-2 sm:gap-3">
          <Link className={buttonStyles({ variant: "ghost" })} href="/entrar">
            Entrar
          </Link>
          <Link
            className={buttonStyles({ className: "hidden sm:inline-flex" })}
            href="/demonstracao"
          >
            Ver demonstração
          </Link>
        </div>
      </div>
      <SiteNavigation className="flex flex-wrap gap-x-4 gap-y-2 border-t border-border px-5 py-3 text-sm font-medium text-muted sm:px-8 lg:hidden" />
    </header>
  );
}
