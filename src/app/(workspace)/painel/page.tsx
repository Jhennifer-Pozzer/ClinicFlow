import { redirect } from "next/navigation";
import { CalendarDays, Database } from "lucide-react";
import { signOut } from "@/auth";
import {
  DailyAgenda,
  UpcomingAppointments,
  appointmentStatus,
} from "@/components/dashboard/appointment-panels";
import {
  EvolutionChart,
  RevenueChart,
  StatusChart,
} from "@/components/dashboard/charts";
import {
  workspaceSections,
  type DashboardAlert,
} from "@/components/dashboard/sections";
import {
  AlertsAndShortcuts,
  Metrics,
  PeriodFilter,
} from "@/components/dashboard/summary";
import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel, PanelHeading } from "@/components/ui/panel";
import { brl, numberLabel, shortDate } from "@/lib/format";
import { authorize } from "@/server/auth/access";
import { roleLabels } from "@/server/auth/permissions";
import { getDashboard } from "@/server/dashboard/data";
import { parsePeriod } from "@/server/dashboard/period";
import type { AppointmentStatus } from "@/generated/prisma/enums";

export const metadata = { title: "Visão geral" };

export default async function WorkspacePage({
  searchParams,
}: PageProps<"/painel">) {
  const result = await authorize("workspace:read");
  if (result.status === 401) redirect("/entrar");
  if (result.status === 403) return <main>Acesso restrito.</main>;

  const { actor } = result;
  const period = parsePeriod((await searchParams).periodo);
  const now = new Date();
  const dashboard = await getDashboard(actor, period, now);
  const { dates, statusCounts, specialties, finance, needsConfirmation } =
    dashboard;
  const sections = workspaceSections(actor.role);
  const status = Object.entries(statusCounts).map(([key, count]) => {
    const { label, fill } = appointmentStatus[key as AppointmentStatus];
    return { label, fill, count };
  });
  const alerts: DashboardAlert[] = [];
  if (needsConfirmation > 0) {
    alerts.push({
      title: "Confirmações pendentes",
      detail:
        needsConfirmation === 1
          ? "1 consulta de hoje aguarda confirmação."
          : `${numberLabel(needsConfirmation)} consultas de hoje aguardam confirmação.`,
      section: "agenda-do-dia",
    });
  }
  if (finance && finance.overdue > 0) {
    alerts.push({
      title: "Recebimentos em atraso",
      detail:
        finance.overdue === 1
          ? "1 conta a receber está vencida."
          : `${numberLabel(finance.overdue)} contas a receber estão vencidas.`,
      section: "financeiro",
    });
  }
  const today = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeZone: actor.organization.timezone,
  }).format(now);
  const rangeLabel = `${shortDate(dates.from)} a ${shortDate(dates.today)}`;
  const hasAppointments = status.some(({ count }) => count > 0);

  return (
    <WorkspaceShell
      profile={{
        name: actor.name,
        email: actor.email,
        role: roleLabels[actor.role],
      }}
      sections={sections}
      alerts={alerts}
      logout={async () => {
        "use server";
        await signOut({ redirectTo: "/entrar" });
      }}
    >
      <section
        id="visao-geral"
        className="mb-5 flex scroll-mt-34 flex-wrap items-end justify-between gap-x-5 gap-y-4 lg:scroll-mt-22"
      >
        <div>
          {actor.organization.isDemo && (
            <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-900">
              <Database size={13} aria-hidden="true" /> Ambiente demonstrativo
            </p>
          )}
          <h1 className="text-3xl font-bold tracking-[-0.045em] sm:text-[2.5rem] sm:leading-tight">
            {actor.organization.name}
          </h1>
          <p className="mt-1.5 flex items-center gap-2 text-sm text-muted">
            <CalendarDays size={16} aria-hidden="true" />
            <span className="first-letter:uppercase">{today}</span>
          </p>
        </div>
        <PeriodFilter key={period} period={period} />
      </section>

      <div className="grid gap-4 sm:gap-5">
        <Metrics dashboard={dashboard} />

        <div
          id="indicadores"
          className="grid scroll-mt-34 items-stretch gap-4 sm:gap-5 lg:scroll-mt-22 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]"
        >
          <Panel>
            <PanelHeading
              title="Evolução dos agendamentos"
              description={`Consultas por dia · ${rangeLabel}`}
            />
            {hasAppointments ? (
              <div className="px-3 pt-4 pb-3 sm:px-5">
                <EvolutionChart data={dashboard.evolution} />
              </div>
            ) : (
              <EmptyState
                title="Sem agendamentos no período"
                detail="Selecione outro intervalo para consultar o histórico."
              />
            )}
          </Panel>
          <Panel>
            <PanelHeading
              title="Consultas por status"
              description={`Distribuição no período · ${rangeLabel}`}
            />
            {hasAppointments ? (
              <div className="px-5 py-5 sm:px-6 xl:pt-8">
                <StatusChart data={status} />
              </div>
            ) : (
              <EmptyState
                title="Sem status para exibir"
                detail="A distribuição aparece quando há consultas no período."
              />
            )}
          </Panel>
        </div>

        <div className="grid items-start gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
          <DailyAgenda
            rows={dashboard.todayRows}
            timezone={actor.organization.timezone}
          />
          <UpcomingAppointments
            rows={dashboard.upcoming}
            timezone={actor.organization.timezone}
          />
        </div>

        <div className="grid items-stretch gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
          <Panel>
            <PanelHeading
              title="Consultas por especialidade"
              description={`Agendamentos por especialidade do serviço · ${rangeLabel}`}
            />
            {specialties.length ? (
              <ul className="grid gap-3 px-5 py-5 sm:px-6">
                {specialties.map(({ name, count }) => (
                  <li key={name}>
                    <div className="mb-1 flex justify-between gap-2 text-sm">
                      <span>{name}</span>
                      <strong className="tabular-nums">
                        {numberLabel(count)}
                      </strong>
                    </div>
                    <div
                      aria-hidden="true"
                      className="h-2 overflow-hidden rounded-full bg-blue-50"
                    >
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${(count / specialties[0].count) * 100}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="Sem consultas por especialidade"
                detail="Selecione um período com agendamentos para ver a distribuição."
              />
            )}
          </Panel>
          {finance && (
            <Panel id="financeiro" className="scroll-mt-34 lg:scroll-mt-22">
              <PanelHeading
                title="Receita mensal"
                description={`Recebimentos agrupados por mês · ${rangeLabel}`}
              />
              {finance.received > 0 ? (
                <div className="px-3 pt-3 sm:px-5">
                  <RevenueChart data={finance.months} />
                </div>
              ) : (
                <EmptyState
                  title="Sem receita recebida no período"
                  detail="Tente outro intervalo para consultar pagamentos registrados."
                />
              )}
              <p className="mx-5 mb-4 rounded-xl bg-teal-50 px-3 py-2 text-sm font-medium text-teal-900 sm:mx-6">
                Recebido no período{" "}
                <strong className="ml-1 tabular-nums">
                  {brl(finance.received)}
                </strong>
              </p>
            </Panel>
          )}
        </div>

        <AlertsAndShortcuts
          alerts={alerts}
          sections={sections}
          role={actor.role}
        />
      </div>
    </WorkspaceShell>
  );
}
