import { notFound } from "next/navigation";
import {
  CalendarBoard,
  CalendarControls,
} from "@/components/operations/agenda-calendar";
import {
  OperationsHeading,
  OperationsWorkspace,
  workspaceActor,
} from "@/components/operations/workspace";
import { can } from "@/server/auth/permissions";
import {
  calendarFilters,
  calendarOptions,
  mayReadCalendar,
  readCalendar,
} from "@/server/operations/calendar";

export const metadata = { title: "Agenda" };

export default async function AgendaPage({
  searchParams,
}: PageProps<"/agenda">) {
  const actor = await workspaceActor();
  if (!mayReadCalendar(actor)) notFound();
  const filters = calendarFilters(actor, await searchParams);
  const [calendar, options] = await Promise.all([
    readCalendar(actor, filters),
    calendarOptions(actor),
  ]);
  const canManage = can(actor.role, "schedules:manage");

  return (
    <OperationsWorkspace actor={actor} active="agenda">
      <OperationsHeading
        title={canManage ? "Agenda" : "Minha agenda"}
        description={
          canManage
            ? "Consulte os atendimentos da clínica e organize os próximos horários."
            : "Consulte os horários e os status dos seus atendimentos."
        }
      />
      <CalendarControls
        key={`${filters.day}-${filters.professionalId}-${filters.specialtyId}`}
        filters={filters}
        options={options}
        period={calendar.period}
        canManage={canManage}
      />
      <CalendarBoard
        calendar={calendar}
        filters={filters}
        timezone={actor.organization.timezone}
      />
    </OperationsWorkspace>
  );
}
