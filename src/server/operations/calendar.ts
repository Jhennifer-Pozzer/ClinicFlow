import type { Prisma } from "@/generated/prisma/client";
import { calendarPeriod, localDay, type CalendarView } from "@/lib/calendar";
import { can } from "@/server/auth/permissions";
import { database } from "@/server/db";
import { missing, OperationError, requirePrivilege, type Actor } from "./core";
import { daySchema, recordId } from "./schemas";
import { midnightRange } from "./slots";

export function mayReadCalendar(actor: Actor) {
  return (
    can(actor.role, "schedules:manage") || can(actor.role, "own-schedule:read")
  );
}

function calendarScope(actor: Actor): Prisma.AppointmentWhereInput {
  if (!mayReadCalendar(actor))
    throw new OperationError("Você não tem acesso à agenda.", 403);
  return {
    organizationId: actor.organizationId,
    ...(can(actor.role, "schedules:manage")
      ? {}
      : {
          professionalId: actor.professional?.active
            ? actor.professional.id
            : { in: [] },
        }),
  };
}

const entry = {
  id: true,
  startsAt: true,
  endsAt: true,
  status: true,
  patient: { select: { name: true } },
  professional: { select: { name: true } },
  service: { select: { name: true } },
} satisfies Prisma.AppointmentSelect;

export function calendarFilters(actor: Actor, params: Record<string, unknown>) {
  const view: CalendarView =
    params.visao === "dia" || params.visao === "mes" ? params.visao : "semana";
  const today = localDay(new Date(), actor.organization.timezone);
  const parsedDay = daySchema.safeParse(params.data);
  const day =
    parsedDay.success &&
    parsedDay.data.slice(0, 4) >= "1901" &&
    parsedDay.data.slice(0, 4) < "9999"
      ? parsedDay.data
      : today;
  const validId = (value: unknown) => recordId.safeParse(value).data;
  const canManage = can(actor.role, "schedules:manage");
  return {
    view,
    day,
    today,
    professionalId: canManage ? validId(params.profissional) : undefined,
    specialtyId: canManage ? validId(params.especialidade) : undefined,
  };
}

export async function readCalendar(
  actor: Actor,
  filters: ReturnType<typeof calendarFilters>,
) {
  const scope = calendarScope(actor);
  const db = database();
  const period = calendarPeriod(filters.day, filters.view);
  const bounds = await midnightRange(
    db,
    period.from,
    period.until,
    actor.organization.timezone,
  );
  const appointments = await db.appointment.findMany({
    where: {
      AND: [scope],
      ...(filters.professionalId
        ? { professionalId: filters.professionalId }
        : {}),
      ...(filters.specialtyId
        ? { service: { specialtyId: filters.specialtyId } }
        : {}),
      startsAt: { gte: bounds.from, lt: bounds.until },
    },
    select: entry,
    orderBy: [{ startsAt: "asc" }, { id: "asc" }],
  });
  return { period, appointments };
}

export async function readAppointment(actor: Actor, id: string) {
  const result = await database().appointment.findFirst({
    where: { ...calendarScope(actor), id },
    select: {
      ...entry,
      patientId: true,
      professionalId: true,
      serviceId: true,
      revision: true,
      history: {
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: {
          id: true,
          event: true,
          fromStatus: true,
          toStatus: true,
          previousStartsAt: true,
          startsAt: true,
          createdAt: true,
          actor: { select: { name: true } },
        },
      },
    },
  });
  if (!result) throw missing();
  return result;
}

export async function calendarOptions(actor: Actor) {
  if (!mayReadCalendar(actor))
    throw new OperationError("Você não tem acesso à agenda.", 403);
  const db = database();
  const where = { organizationId: actor.organizationId };
  if (!can(actor.role, "schedules:manage"))
    return { professionals: [], specialties: [] };
  const [professionals, specialties] = await Promise.all([
    db.professional.findMany({
      where,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.specialty.findMany({
      where,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return { professionals, specialties };
}

export async function bookingOptions(
  actor: Actor,
  selection?: { patientId: string; professionalId: string; serviceId: string },
) {
  requirePrivilege(actor, "schedules:manage");
  const where = { organizationId: actor.organizationId };
  const db = database();
  const [patients, professionals, services] = await Promise.all([
    db.patient.findMany({
      where: {
        ...where,
        OR: [
          { archivedAt: null },
          ...(selection ? [{ id: selection.patientId }] : []),
        ],
      },
      select: { id: true, name: true, internalCode: true },
      orderBy: { name: "asc" },
    }),
    db.professional.findMany({
      where: {
        ...where,
        OR: [
          { active: true, specialty: { active: true } },
          ...(selection ? [{ id: selection.professionalId }] : []),
        ],
      },
      select: { id: true, name: true, specialtyId: true },
      orderBy: { name: "asc" },
    }),
    db.service.findMany({
      where: {
        ...where,
        OR: [
          { active: true, specialty: { active: true } },
          ...(selection ? [{ id: selection.serviceId }] : []),
        ],
      },
      select: {
        id: true,
        name: true,
        specialtyId: true,
        durationMinutes: true,
        priceCents: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);
  return { patients, professionals, services };
}
