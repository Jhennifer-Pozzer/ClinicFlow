import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BookingEditor,
  StatusEditor,
} from "@/components/operations/booking-form";
import {
  OperationsHeading,
  OperationsWorkspace,
  ResultMessage,
  pageRecord,
  workspaceActor,
} from "@/components/operations/workspace";
import { appointmentStatus } from "@/components/dashboard/appointment-panels";
import { buttonStyles } from "@/components/ui/button";
import { Panel, PanelHeading } from "@/components/ui/panel";
import { localDay, localTime } from "@/lib/calendar";
import { can } from "@/server/auth/permissions";
import {
  allowedStatuses,
  isOpenStatus,
} from "@/server/operations/appointments";
import {
  bookingOptions,
  mayReadCalendar,
  readAppointment,
} from "@/server/operations/calendar";
import { recordId } from "@/server/operations/schemas";

export const metadata = { title: "Detalhes do agendamento" };

const eventNames = {
  CREATED: "Agendamento criado",
  UPDATED: "Cadastro atualizado",
  RESCHEDULED: "Agendamento reagendado",
  STATUS_CHANGED: "Situação atualizada",
} as const;

export default async function AppointmentDetailPage({
  params,
  searchParams,
}: PageProps<"/agenda/[id]">) {
  const id = recordId.safeParse((await params).id).data;
  if (!id) notFound();
  const actor = await workspaceActor();
  if (!mayReadCalendar(actor)) notFound();
  const record = await pageRecord(readAppointment(actor, id));
  const manage =
    can(actor.role, "schedules:manage") && isOpenStatus(record.status);
  const options = manage ? await bookingOptions(actor, record) : null;
  const { timezone } = actor.organization;
  const day = localDay(record.startsAt, timezone);
  const time = localTime(record.startsAt, timezone);
  const date = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: timezone,
  });
  const { label, badge } = appointmentStatus[record.status];
  const states = manage
    ? allowedStatuses(record.status, record.startsAt, new Date())
    : [];

  return (
    <OperationsWorkspace actor={actor} active="agenda">
      <OperationsHeading
        title={record.patient.name}
        description={`${record.service.name} · ${record.professional.name}`}
      >
        <Link
          href={`/agenda?visao=dia&data=${day}`}
          className={buttonStyles({ variant: "outline" })}
        >
          Voltar para agenda
        </Link>
      </OperationsHeading>
      {(await searchParams).salvo === "1" && (
        <ResultMessage text="Agendamento atualizado com sucesso." />
      )}
      <Panel className="mb-5 flex flex-wrap items-center justify-between gap-3 p-5">
        <p className="text-sm font-semibold">
          {date.format(record.startsAt)} até{" "}
          {localTime(record.endsAt, timezone)}
        </p>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${badge}`}
        >
          {label}
        </span>
      </Panel>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        {options && (
          <Panel>
            <PanelHeading
              title="Editar ou reagendar"
              description="Consulte a disponibilidade ao alterar o horário ou o serviço."
            />
            <BookingEditor
              key={record.revision}
              options={options}
              initial={{
                patientId: record.patientId,
                professionalId: record.professionalId,
                serviceId: record.serviceId,
                day,
                time,
              }}
              booking={{ id, revision: record.revision }}
              timezone={timezone}
            />
          </Panel>
        )}
        <div className="grid gap-5">
          {states.length > 0 && (
            <Panel>
              <PanelHeading title="Situação do atendimento" />
              <StatusEditor
                key={record.revision}
                booking={{ id, revision: record.revision }}
                options={states}
              />
            </Panel>
          )}
          <Panel>
            <PanelHeading title="Histórico de alterações" />
            {record.history.length ? (
              <ul className="mt-3 divide-y divide-border">
                {record.history.map((change) => (
                  <li key={change.id} className="px-5 py-3 sm:px-6">
                    <p className="text-sm font-semibold">
                      {eventNames[change.event]} ·{" "}
                      {appointmentStatus[change.toStatus].label}
                    </p>
                    {change.event === "RESCHEDULED" &&
                      change.previousStartsAt &&
                      change.startsAt && (
                        <p className="mt-1 text-sm text-muted">
                          {date.format(change.previousStartsAt)} →{" "}
                          {date.format(change.startsAt)}
                        </p>
                      )}
                    <p className="mt-1 text-xs text-muted">
                      {date.format(change.createdAt)}
                      {change.actor && ` · ${change.actor.name}`}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-5 text-sm text-muted">
                Nenhuma alteração registrada.
              </p>
            )}
          </Panel>
        </div>
      </div>
    </OperationsWorkspace>
  );
}
