import {
  CalendarDays,
  ChartNoAxesCombined,
  Clock3,
  LayoutDashboard,
  HeartPulse,
  ClipboardList,
  Stethoscope,
  UsersRound,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { cn } from "@/lib/utils";
import { Notifications, ProfileMenu, SearchControl } from "./header-controls";
import type { DashboardAlert, DashboardSection } from "./sections";

const icons = {
  "visao-geral": LayoutDashboard,
  indicadores: ChartNoAxesCombined,
  "agenda-do-dia": CalendarDays,
  "proximos-atendimentos": Clock3,
  financeiro: Wallet,
  agenda: CalendarDays,
  pacientes: UsersRound,
  profissionais: Stethoscope,
  especialidades: HeartPulse,
  servicos: ClipboardList,
};

function Navigation({
  sections,
  active,
  mobile = false,
}: {
  sections: DashboardSection[];
  active: string;
  mobile?: boolean;
}) {
  return (
    <nav
      aria-label="Seções do painel"
      className={
        mobile
          ? "overflow-x-auto border-t border-border px-3 lg:hidden"
          : "px-3.5"
      }
    >
      <ul className={mobile ? "flex min-w-max gap-1 py-2" : "grid gap-1"}>
        {sections.map(({ id, label, href }) => {
          const Icon = icons[id as keyof typeof icons];
          return (
            <li key={id}>
              <Link
                href={href ?? `#${id}`}
                aria-current={id === active ? "page" : undefined}
                className={cn(
                  "flex min-h-10 items-center gap-2.5 rounded-lg px-3 text-sm font-medium text-muted hover:bg-slate-100 hover:text-ink",
                  id === active &&
                    "bg-blue-50 font-semibold text-blue-800 hover:bg-blue-100 hover:text-blue-900",
                )}
              >
                <Icon size={17} aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

type Profile = { name: string; email: string; role: string };

export function WorkspaceShell({
  profile,
  sections,
  alerts,
  logout,
  active = "visao-geral",
  children,
}: {
  profile: Profile;
  sections: DashboardSection[];
  alerts?: DashboardAlert[];
  active?: string;
  logout: () => Promise<void>;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[#f5f7fb] lg:grid lg:grid-cols-[224px_minmax(0,1fr)]">
      <a
        href="#painel-conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:rounded-lg focus:bg-white focus:p-3"
      >
        Pular para o conteúdo
      </a>
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border bg-white lg:flex">
        <div className="flex h-17 items-center border-b border-border px-5">
          <Link href="/painel" aria-label="ClinicFlow, painel">
            <Brand />
          </Link>
        </div>
        <div className="mt-7 min-h-0 overflow-y-auto">
          <p className="mb-3 px-6 text-xs font-semibold tracking-wide text-muted uppercase">
            Painel da clínica
          </p>
          <Navigation sections={sections} active={active} />
        </div>
        <Link
          href="/"
          className="mx-5 mt-auto mb-5 rounded-lg py-2 text-sm font-medium text-muted hover:text-primary"
        >
          Página institucional
        </Link>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-border bg-white">
          <div className="mx-auto flex h-17 max-w-[1536px] items-center justify-between gap-2 px-4 sm:px-7 xl:px-9">
            <Link
              href="/painel"
              className="lg:hidden"
              aria-label="ClinicFlow, painel"
            >
              <Brand />
            </Link>
            <div className="hidden items-center gap-2 text-sm lg:flex">
              <span className="text-muted">Painel</span>
              <span aria-hidden="true" className="text-slate-400">
                /
              </span>
              <span className="font-semibold">
                {sections.find(({ id }) => id === active)?.label}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
              <SearchControl sections={sections} />
              {alerts && <Notifications alerts={alerts} />}
              <div aria-hidden="true" className="mx-0.5 h-6 w-px bg-border" />
              <ProfileMenu {...profile} logout={logout} />
            </div>
          </div>
          <Navigation sections={sections} active={active} mobile />
        </header>
        <main
          id="painel-conteudo"
          className="mx-auto max-w-[1536px] px-4 pt-7 pb-11 sm:px-7 xl:px-9"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
