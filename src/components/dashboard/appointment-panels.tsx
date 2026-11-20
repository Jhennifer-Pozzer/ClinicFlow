import { CalendarDays, Clock3 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel, PanelHeading } from "@/components/ui/panel";
import { type AppointmentStatus } from "@/generated/prisma/enums";
import type { DashboardAppointment } from "@/server/dashboard/data";

export const appointmentStatus = {
  SCHEDULED: {
    label: "Agendado",
    badge: "bg-blue-50 text-blue-800",
    fill: "#2563eb",
  },
  CONFIRMED: {
    label: "Confirmado",
    badge: "bg-violet-50 text-violet-800",
    fill: "#7c3aed",
  },
  COMPLETED: {
    label: "Realizado",
    badge: "bg-teal-50 text-teal-900",
    fill: "#0d9488",
  },
  CANCELLED: {
    label: "Cancelado",
    badge: "bg-rose-50 text-rose-800",
    fill: "#e11d48",
  },
  NO_SHOW: {
    label: "Não compareceu",
    badge: "bg-amber-50 text-amber-900",
    fill: "#b45309",
  },
} satisfies Record<
  AppointmentStatus,
  { label: string; badge: string; fill: string }
>;

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const { badge, label } = appointmentStatus[status];
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${badge}`}
    >
      {label}
    </span>
  );
}

export function DailyAgenda({
  rows,
  timezone,
}: {
  rows: DashboardAppointment[];
  timezone: string;
}) {
  const time = new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <Panel id="agenda-do-dia" className="scroll-mt-34 lg:scroll-mt-22">
      <PanelHeading
        title="Agenda do dia"
        description="Consultas de hoje no horário da clínica."
      />
      {rows.length ? (
        <>
          <ul
            className="mt-3 divide-y divide-border px-5 pb-2 sm:hidden"
            aria-label="Horários de hoje"
          >
            {rows.map(
              ({ id, startsAt, status, patient, service, professional }) => (
                <li key={id} className="py-3 text-sm">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <time
                      className="font-semibold tabular-nums"
                      dateTime={startsAt.toISOString()}
                    >
                      {time.format(startsAt)}
                    </time>
                    <StatusBadge status={status} />
                  </div>
                  <p className="font-semibold">{patient.name}</p>
                  <p className="mt-0.5 text-muted">
                    {service.name} · {professional.name}
                  </p>
                </li>
              ),
            )}
          </ul>
          <div
            className="mt-4 hidden overflow-x-auto rounded-b-2xl sm:block"
            tabIndex={0}
            role="region"
            aria-label="Horários de hoje"
          >
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-muted">
                <tr>
                  {[
                    "Horário",
                    "Paciente e serviço",
                    "Profissional",
                    "Status",
                  ].map((title) => (
                    <th
                      key={title}
                      scope="col"
                      className="px-4 py-3 first:pl-5 sm:first:pl-6"
                    >
                      {title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((appointment) => (
                  <tr key={appointment.id}>
                    <td className="px-4 py-3 pl-5 font-semibold tabular-nums sm:pl-6">
                      <time dateTime={appointment.startsAt.toISOString()}>
                        {time.format(appointment.startsAt)}
                      </time>
                    </td>
                    <td className="min-w-44 px-4 py-3">
                      <span className="block font-semibold">
                        {appointment.patient.name}
                      </span>
                      <span className="mt-0.5 block text-muted">
                        {appointment.service.name}
                      </span>
                    </td>
                    <td className="min-w-35 px-4 py-3 text-muted">
                      {appointment.professional.name}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={appointment.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <EmptyState
          title="Nenhum atendimento registrado hoje"
          detail="Consulte os próximos atendimentos para ver os horários futuros."
        />
      )}
    </Panel>
  );
}

export function UpcomingAppointments({
  rows,
  timezone,
}: {
  rows: DashboardAppointment[];
  timezone: string;
}) {
  const date = new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    day: "2-digit",
    month: "short",
  });
  const time = new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <Panel id="proximos-atendimentos" className="scroll-mt-34 lg:scroll-mt-22">
      <PanelHeading
        title="Próximos atendimentos"
        description="Até cinco consultas agendadas ou confirmadas."
      />
      {rows.length ? (
        <ul className="mt-2 divide-y divide-border px-5 pb-2 sm:px-6">
          {rows.map((appointment) => (
            <li key={appointment.id} className="flex items-center gap-3 py-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-primary">
                <CalendarDays size={17} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {appointment.patient.name}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {appointment.professional.name}
                </p>
              </div>
              <time
                dateTime={appointment.startsAt.toISOString()}
                className="ml-auto shrink-0 text-right text-xs text-muted"
              >
                <span className="block">
                  {date.format(appointment.startsAt)}
                </span>
                <span className="mt-0.5 flex items-center justify-end gap-1 font-semibold text-ink">
                  <Clock3 size={12} aria-hidden="true" />
                  {time.format(appointment.startsAt)}
                </span>
              </time>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="Sem próximos atendimentos"
          detail="Os próximos horários confirmados ou agendados aparecerão aqui."
        />
      )}
    </Panel>
  );
}
