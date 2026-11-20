import { Prisma } from "@/generated/prisma/client";
import { localDay, localTime, shiftDay } from "@/lib/calendar";
import { minuteLabel } from "@/lib/operations";
import { database } from "@/server/db";
import { OperationError } from "./core";
import { asMinute } from "./schemas";

export async function midnightRange(
  db: Prisma.TransactionClient,
  from: string,
  until: string,
  timezone: string,
) {
  const [result] = await db.$queryRaw<{ from: Date; until: Date }[]>`
    SELECT (${from}::date::timestamp AT TIME ZONE ${timezone}) AS "from",
           (${until}::date::timestamp AT TIME ZONE ${timezone}) AS "until"
  `;
  return result;
}

export async function bookingResources(
  db: Prisma.TransactionClient,
  organizationId: string,
  professionalId: string,
  serviceId: string,
  day: string,
) {
  const [professional, service] = await Promise.all([
    db.professional.findFirst({
      where: {
        organizationId,
        id: professionalId,
        active: true,
        specialty: { active: true },
      },
      select: {
        specialtyId: true,
        availability: {
          where: { weekday: new Date(day).getUTCDay() },
          orderBy: { startMinute: "asc" },
          select: { startMinute: true, endMinute: true },
        },
      },
    }),
    db.service.findFirst({
      where: {
        organizationId,
        id: serviceId,
        active: true,
        specialty: { active: true },
      },
      select: { durationMinutes: true, priceCents: true, specialtyId: true },
    }),
  ]);
  if (
    !professional ||
    !service ||
    professional.specialtyId !== service.specialtyId
  ) {
    throw new OperationError(
      "Escolha um profissional ativo que atenda a especialidade do serviço.",
    );
  }
  return { windows: professional.availability, service };
}

export async function localInstants(
  db: Prisma.TransactionClient,
  day: string,
  times: string[],
  timezone: string,
) {
  if (!times.length) return [];
  const values = Prisma.join(times.map((time) => Prisma.sql`(${time}::text)`));
  const rows = await db.$queryRaw<{ time: string; startsAt: Date }[]>`
    SELECT local.time, ((${day} || 'T' || local.time)::timestamp AT TIME ZONE ${timezone}) AS "startsAt"
    FROM (VALUES ${values}) AS local(time)
    ORDER BY local.time
  `;
  return rows.filter(
    ({ time, startsAt }) =>
      localDay(startsAt, timezone) === day &&
      localTime(startsAt, timezone) === time,
  );
}

export function fitsWindow(
  start: number,
  end: number,
  windows: { startMinute: number; endMinute: number }[],
) {
  if (end <= start) return false;
  let covered = start;
  // As faixas são carregadas em ordem de início.
  for (const window of windows) {
    if (window.startMinute > covered) break;
    covered = Math.max(covered, window.endMinute);
    if (covered >= end) return true;
  }
  return false;
}

export function endMinute(day: string, endsAt: Date, timezone: string) {
  const endDay = localDay(endsAt, timezone);
  const time = localTime(endsAt, timezone);
  if (endDay === day) return asMinute(time);
  return endDay === shiftDay(day, 1) && time === "00:00" ? 1440 : -1;
}

export async function availableSlots(
  organizationId: string,
  timezone: string,
  input: {
    day: string;
    professionalId: string;
    serviceId: string;
    appointmentId?: string;
  },
  now = new Date(),
) {
  const db = database();
  const { day, professionalId, serviceId, appointmentId } = input;
  if (day < localDay(now, timezone)) return [];
  const { service, windows } = await bookingResources(
    db,
    organizationId,
    professionalId,
    serviceId,
    day,
  );
  const times = windows.flatMap(({ startMinute, endMinute }) => {
    const options: string[] = [];
    for (let start = startMinute; start < endMinute; start += 15)
      options.push(minuteLabel(start));
    return options;
  });
  const bounds = await midnightRange(db, day, shiftDay(day, 1), timezone);
  const [candidates, occupied] = await Promise.all([
    localInstants(db, day, times, timezone),
    db.appointment.findMany({
      where: {
        organizationId,
        professionalId,
        id: appointmentId ? { not: appointmentId } : undefined,
        status: { not: "CANCELLED" },
        startsAt: { lt: bounds.until },
        endsAt: { gt: bounds.from },
      },
      select: { startsAt: true, endsAt: true },
    }),
  ]);
  return candidates
    .filter(({ time, startsAt }) => {
      const endsAt = new Date(
        startsAt.getTime() + service.durationMinutes * 60_000,
      );
      return (
        startsAt >= now &&
        fitsWindow(asMinute(time), endMinute(day, endsAt, timezone), windows) &&
        !occupied.some(
          (appt) => appt.startsAt < endsAt && appt.endsAt > startsAt,
        )
      );
    })
    .map(({ time }) => time);
}
