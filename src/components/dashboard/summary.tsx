import Link from "next/link";
import type { Role } from "@/generated/prisma/enums";
import { can } from "@/server/auth/permissions";
import Form from "next/form";
import {
  Bell,
  CalendarCheck,
  CalendarDays,
  CalendarX,
  ChevronDown,
  CircleDollarSign,
  Hourglass,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeading } from "@/components/ui/panel";
import { brl, numberLabel } from "@/lib/format";
import { periods, type Period } from "@/server/dashboard/period";
import type { getDashboard } from "@/server/dashboard/data";
import type { DashboardAlert, DashboardSection } from "./sections";

type Dashboard = Awaited<ReturnType<typeof getDashboard>>;

const metric = {
  today: {
    label: "Na agenda hoje",
    hint: "Sem canceladas",
    icon: CalendarDays,
    color: "bg-blue-50 text-primary",
  },
  done: {
    label: "Consultas realizadas",
    hint: "No período",
    icon: CalendarCheck,
    color: "bg-teal-50 text-teal-700",
  },
  cancellations: {
    label: "Cancelamentos",
    hint: "No período",
    icon: CalendarX,
    color: "bg-rose-50 text-rose-700",
  },
  patients: {
    label: "Pacientes cadastrados",
    hint: "Novos no período",
    icon: UsersRound,
    color: "bg-violet-50 text-violet-700",
  },
  revenue: {
    label: "Receita recebida",
    hint: "Pagamentos no período",
    icon: CircleDollarSign,
    color: "bg-emerald-50 text-emerald-700",
  },
  pending: {
    label: "Valores pendentes",
    hint: "Com vencimento no período",
    icon: Hourglass,
    color: "bg-amber-50 text-amber-800",
  },
} satisfies Record<
  string,
  { label: string; hint: string; icon: LucideIcon; color: string }
>;

export function Metrics({ dashboard }: { dashboard: Dashboard }) {
  const { todayCount, statusCounts, patients, finance } = dashboard;
  const cards = [
    { ...metric.today, value: numberLabel(todayCount) },
    { ...metric.done, value: numberLabel(statusCounts.COMPLETED) },
    { ...metric.cancellations, value: numberLabel(statusCounts.CANCELLED) },
    ...(patients === null
      ? []
      : [{ ...metric.patients, value: numberLabel(patients) }]),
    ...(finance
      ? [
          { ...metric.revenue, value: brl(finance.received) },
          { ...metric.pending, value: brl(finance.pending) },
        ]
      : []),
  ];
  return (
    <dl className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,150px),1fr))] gap-3 sm:gap-4">
      {cards.map(({ label, value, hint, icon: Icon, color }) => (
        <div
          key={label}
          className="min-w-0 rounded-2xl border border-border bg-white p-4 shadow-panel"
        >
          <dt className="text-sm leading-5 font-medium text-muted">
            <span
              className={`mb-3 grid size-9 place-items-center rounded-lg ${color}`}
            >
              <Icon size={18} aria-hidden="true" />
            </span>
            {label}
          </dt>
          <dd>
            <span className="mt-1 block text-xl font-bold tracking-tight break-words tabular-nums">
              {value}
            </span>
            <span className="mt-1 block text-xs leading-4 text-muted">
              {hint}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function PeriodFilter({ period }: { period: Period }) {
  return (
    <Form action="/painel" className="flex flex-wrap items-end gap-2">
      <div>
        <label
          htmlFor="periodo"
          className="mb-1 block text-xs font-semibold text-muted"
        >
          Período
        </label>
        <div className="relative">
          <select
            name="periodo"
            id="periodo"
            defaultValue={period}
            className="h-11 appearance-none rounded-lg border border-border bg-white py-2 pr-9 pl-3 text-sm font-medium text-ink focus-visible:outline-primary"
          >
            {(["month", "7", "30", "90"] as const).map((option) => (
              <option key={option} value={option}>
                {periods[option]}
              </option>
            ))}
          </select>
          <ChevronDown
            size={15}
            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
        </div>
      </div>
      <Button variant="outline" type="submit">
        Aplicar
      </Button>
    </Form>
  );
}

export function AlertsAndShortcuts({
  alerts,
  sections,
  role,
}: {
  alerts: DashboardAlert[];
  sections: DashboardSection[];
  role: Role;
}) {
  const shortcuts = sections.filter(
    ({ id, href }) => id !== "visao-geral" && !href,
  );
  if (can(role, "patients:manage"))
    shortcuts.unshift({
      id: "novo-paciente",
      label: "Novo paciente",
      href: "/pacientes/novo",
      keywords: "",
    });
  if (can(role, "schedules:manage"))
    shortcuts.unshift({
      id: "novo-agendamento",
      label: "Novo agendamento",
      href: "/agenda/novo",
      keywords: "",
    });
  if (can(role, "catalog:manage"))
    shortcuts.push({
      id: "novo-profissional",
      label: "Novo profissional",
      href: "/profissionais/novo",
      keywords: "",
    });
  return (
    <Panel>
      <PanelHeading title="Alertas e atalhos" />
      <div className="grid gap-5 px-5 py-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:px-6">
        <div>
          {alerts.length ? (
            <ul className="grid gap-2.5">
              {alerts.map(({ title, detail, section }) => (
                <li key={title}>
                  <a
                    href={`#${section}`}
                    className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-950 transition-colors hover:bg-amber-100"
                  >
                    <Bell
                      size={17}
                      className="mt-0.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span>
                      <span className="block text-sm font-semibold">
                        {title}
                      </span>
                      <span className="mt-0.5 block text-sm">{detail}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-border bg-surface p-3 text-sm text-muted">
              Nenhum alerta pendente.
            </p>
          )}
        </div>
        <nav
          aria-label="Atalhos do painel"
          className="flex flex-wrap content-start gap-2"
        >
          {shortcuts.map(({ id, label, href }) => (
            <Link
              key={id}
              href={href ?? `#${id}`}
              className="inline-flex min-h-10 items-center rounded-lg border border-border px-3 text-sm font-semibold text-blue-800 hover:bg-blue-50"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </Panel>
  );
}
