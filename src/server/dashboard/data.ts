import { Prisma } from "@/generated/prisma/client";
import { AppointmentStatus } from "@/generated/prisma/enums";
import type { currentActor } from "@/server/auth/access";
import { can } from "@/server/auth/permissions";
import { database } from "@/server/db";
import { dashboardDates, type Period } from "./period";

type Actor = NonNullable<Awaited<ReturnType<typeof currentActor>>>;
type Status = AppointmentStatus;

const appointmentSelect = {
  id: true,
  startsAt: true,
  status: true,
  patient: { select: { name: true } },
  professional: { select: { name: true } },
  service: { select: { name: true } },
} satisfies Prisma.AppointmentSelect;

export type DashboardAppointment = Prisma.AppointmentGetPayload<{
  select: typeof appointmentSelect;
}>;

export async function getDashboard(
  actor: Actor,
  period: Period,
  now = new Date(),
) {
  const organizationId = actor.organizationId;
  const timezone = actor.organization.timezone;
  const dates = dashboardDates(period, now, timezone);
  const db = database();
  const [bounds] = await db.$queryRaw<
    { from: Date; dayStart: Date; until: Date }[]
  >`
    SELECT
      (${dates.from}::date::timestamp AT TIME ZONE ${timezone}) AS "from",
      (${dates.today}::date::timestamp AT TIME ZONE ${timezone}) AS "dayStart",
      (${dates.until}::date::timestamp AT TIME ZONE ${timezone}) AS "until"
  `;

  const ownSchedule = can(actor.role, "own-schedule:read");
  const ownId = actor.professional?.active ? actor.professional.id : null;
  const schedule = ownSchedule
    ? { organizationId, professionalId: ownId ?? { in: [] } }
    : { organizationId };
  const todayScope = {
    ...schedule,
    startsAt: { gte: bounds.dayStart, lt: bounds.until },
  };
  const clinicTotals = can(actor.role, "patients:manage");
  const showFinance = can(actor.role, "finance:manage");
  const upcomingStatuses = [
    AppointmentStatus.SCHEDULED,
    AppointmentStatus.CONFIRMED,
  ];

  const [
    grouped,
    todayCount,
    todayRows,
    upcoming,
    patients,
    finance,
    needsConfirmation,
  ] = await Promise.all([
    ownSchedule && !ownId
      ? []
      : db.$queryRaw<
          { day: string; status: Status; specialty: string; count: number }[]
        >`
        SELECT to_char(a."startsAt" AT TIME ZONE ${timezone}, 'YYYY-MM-DD') AS day,
               a.status, sp.name AS specialty, COUNT(*)::int AS count
        FROM "Appointment" a
        JOIN "Service" s ON s.id = a."serviceId" AND s."organizationId" = a."organizationId"
        JOIN "Specialty" sp ON sp.id = s."specialtyId" AND sp."organizationId" = a."organizationId"
        WHERE a."organizationId" = ${organizationId}::uuid
          AND a."startsAt" >= ${bounds.from} AND a."startsAt" < ${bounds.until}
          ${ownSchedule ? Prisma.sql`AND a."professionalId" = ${ownId}::uuid` : Prisma.empty}
        GROUP BY 1, 2, 3
      `,
    db.appointment.count({
      where: { ...todayScope, status: { not: AppointmentStatus.CANCELLED } },
    }),
    db.appointment.findMany({
      where: todayScope,
      select: appointmentSelect,
      orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    }),
    db.appointment.findMany({
      where: {
        ...schedule,
        startsAt: { gte: now },
        status: { in: upcomingStatuses },
      },
      select: appointmentSelect,
      orderBy: [{ startsAt: "asc" }, { id: "asc" }],
      take: 5,
    }),
    clinicTotals
      ? db.patient.count({
          where: {
            organizationId,
            createdAt: { gte: bounds.from, lt: bounds.until },
          },
        })
      : null,
    showFinance ? getFinance(organizationId, timezone, dates, bounds) : null,
    db.appointment.count({
      where: {
        ...todayScope,
        startsAt: { gte: now, lt: bounds.until },
        status: AppointmentStatus.SCHEDULED,
      },
    }),
  ]);

  const statusCounts: Record<Status, number> = {
    SCHEDULED: 0,
    CONFIRMED: 0,
    COMPLETED: 0,
    CANCELLED: 0,
    NO_SHOW: 0,
  };
  const dayCounts = new Map(dates.days.map((day) => [day, 0]));
  const specialtyCounts = new Map<string, number>();
  for (const { day, status, specialty, count } of grouped) {
    statusCounts[status] += count;
    dayCounts.set(day, (dayCounts.get(day) ?? 0) + count);
    specialtyCounts.set(
      specialty,
      (specialtyCounts.get(specialty) ?? 0) + count,
    );
  }

  const specialties = Array.from(specialtyCounts, ([name, count]) => ({
    name,
    count,
  })).sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name, "pt-BR"),
  );
  return {
    dates,
    todayCount,
    todayRows,
    upcoming,
    patients,
    finance,
    statusCounts,
    specialties,
    needsConfirmation,
    evolution: Array.from(dayCounts, ([day, count]) => ({ day, count })),
  };
}

async function getFinance(
  organizationId: string,
  timezone: string,
  dates: ReturnType<typeof dashboardDates>,
  bounds: { from: Date; until: Date },
) {
  const db = database();
  const scope = {
    organizationId,
    type: "RECEIVABLE",
    status: "PENDING",
  } as const;
  const [received, pending, overdue] = await Promise.all([
    db.$queryRaw<{ month: string; cents: number }[]>`
      SELECT to_char("settledAt" AT TIME ZONE ${timezone}, 'YYYY-MM') AS month,
             SUM("amountCents")::double precision AS cents
      FROM "FinancialTransaction"
      WHERE "organizationId" = ${organizationId}::uuid AND type = 'RECEIVABLE' AND status = 'SETTLED'
        AND "settledAt" >= ${bounds.from} AND "settledAt" < ${bounds.until}
      GROUP BY 1
    `,
    db.financialTransaction.aggregate({
      where: {
        ...scope,
        dueDate: { gte: new Date(dates.from), lt: new Date(dates.until) },
      },
      _sum: { amountCents: true },
    }),
    db.financialTransaction.count({
      where: { ...scope, dueDate: { lt: new Date(dates.today) } },
    }),
  ]);

  const centsByMonth = new Map(
    received.map(({ month, cents }) => [month, cents]),
  );
  const months = Array.from(
    new Set(dates.days.map((day) => day.slice(0, 7))),
    (month) => ({
      month,
      cents: centsByMonth.get(month) ?? 0,
    }),
  );
  return {
    months,
    overdue,
    pending: pending._sum.amountCents ?? 0,
    received: months.reduce((total, { cents }) => total + cents, 0),
  };
}
