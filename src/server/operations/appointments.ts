import { createHash } from "node:crypto";
import type { AppointmentStatus } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { localDay, localTime } from "@/lib/calendar";
import { database } from "@/server/db";
import {
  audit,
  missing,
  OperationError,
  requirePrivilege,
  writeOperation,
  type Actor,
} from "./core";
import { asMinute, type BookingInput } from "./schemas";
import {
  bookingResources,
  endMinute,
  fitsWindow,
  localInstants,
} from "./slots";

const nextStatuses: Record<AppointmentStatus, AppointmentStatus[]> = {
  SCHEDULED: ["CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"],
  CONFIRMED: ["CANCELLED", "COMPLETED", "NO_SHOW"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

export function allowedStatuses(
  status: AppointmentStatus,
  start: Date,
  now: Date,
) {
  return nextStatuses[status]
    .filter((value) => value !== "CONFIRMED" || start > now)
    .filter(
      (value) => (value !== "COMPLETED" && value !== "NO_SHOW") || start <= now,
    );
}

export function isOpenStatus(status: AppointmentStatus) {
  return status === "SCHEDULED" || status === "CONFIRMED";
}

async function checkPatient(
  tx: Prisma.TransactionClient,
  organizationId: string,
  patientId: string,
) {
  if (
    !(await tx.patient.findFirst({
      where: { organizationId, id: patientId, archivedAt: null },
      select: { id: true },
    }))
  ) {
    throw new OperationError("Escolha um paciente ativo desta clínica.");
  }
}

async function scheduleValues(
  tx: Prisma.TransactionClient,
  actor: Actor,
  input: BookingInput,
  now: Date,
  excludeId?: string,
) {
  const { patientId, professionalId, serviceId, day, time } = input;
  const {
    organizationId,
    organization: { timezone },
  } = actor;
  const [{ service, windows }, [instant]] = await Promise.all([
    bookingResources(tx, organizationId, professionalId, serviceId, day),
    localInstants(tx, day, [time], timezone),
  ]);
  const startsAt = instant?.startsAt;
  if (!startsAt || startsAt < now)
    throw new OperationError(
      "Escolha um horário futuro válido no fuso da clínica.",
    );
  const endsAt = new Date(
    startsAt.getTime() + service.durationMinutes * 60_000,
  );
  if (!fitsWindow(asMinute(time), endMinute(day, endsAt, timezone), windows)) {
    throw new OperationError(
      "A duração do serviço não cabe na disponibilidade do profissional.",
    );
  }
  const clash = await tx.appointment.findFirst({
    where: {
      organizationId,
      professionalId,
      id: excludeId ? { not: excludeId } : undefined,
      status: { not: "CANCELLED" },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
    select: { id: true },
  });
  if (clash)
    throw new OperationError(
      "O profissional já tem um atendimento neste horário.",
      409,
    );
  return {
    patientId,
    professionalId,
    serviceId,
    startsAt,
    endsAt,
    priceCents: service.priceCents,
  };
}

export async function createAppointment(
  actor: Actor,
  input: BookingInput & { requestKey: string },
  now = new Date(),
) {
  requirePrivilege(actor, "schedules:manage");
  const { appointment, requireSameRequest } = getReplayLookup(actor, input);
  try {
    return await writeOperation(async (tx) => {
      const previous = await appointment(tx);
      if (previous) return requireSameRequest(previous);
      await checkPatient(tx, actor.organizationId, input.patientId);
      const values = await scheduleValues(tx, actor, input, now);
      const record = await tx.appointment.create({
        data: {
          ...values,
          organizationId: actor.organizationId,
          requestKey: input.requestKey,
          requestFingerprint: fingerprint(input),
        },
        select: { id: true },
      });
      await history(
        tx,
        actor,
        record.id,
        "CREATED",
        "SCHEDULED",
        null,
        values.startsAt,
      );
      return { ...record, replayed: false };
    });
  } catch (error) {
    if (error instanceof OperationError && error.status === 409) {
      const previous = await appointment(database());
      if (previous) return requireSameRequest(previous);
    }
    throw error;
  }
}

function fingerprint(input: BookingInput) {
  return createHash("sha256")
    .update(
      JSON.stringify([
        input.patientId,
        input.professionalId,
        input.serviceId,
        input.day,
        input.time,
      ]),
    )
    .digest("hex");
}

function getReplayLookup(
  actor: Actor,
  input: BookingInput & { requestKey: string },
) {
  return {
    appointment: (tx: Prisma.TransactionClient) =>
      tx.appointment.findUnique({
        where: {
          organizationId_requestKey: {
            organizationId: actor.organizationId,
            requestKey: input.requestKey,
          },
        },
        select: { id: true, requestFingerprint: true },
      }),
    requireSameRequest: (previous: {
      id: string;
      requestFingerprint: string | null;
    }) => {
      if (previous.requestFingerprint !== fingerprint(input))
        throw new OperationError(
          "Esta solicitação já foi usada para outro agendamento. Abra um novo formulário.",
          409,
        );
      return { id: previous.id, replayed: true };
    },
  };
}

export async function updateAppointment(
  actor: Actor,
  id: string,
  input: BookingInput & { revision: number },
  now = new Date(),
) {
  requirePrivilege(actor, "schedules:manage");
  return writeOperation(async (tx) => {
    const previous = await editableAppointment(tx, actor, id, input.revision);
    const timezone = actor.organization.timezone;
    const rescheduled =
      previous.professionalId !== input.professionalId ||
      previous.serviceId !== input.serviceId ||
      localDay(previous.startsAt, timezone) !== input.day ||
      localTime(previous.startsAt, timezone) !== input.time;
    if (!rescheduled && previous.patientId === input.patientId) return { id };
    if (rescheduled || previous.patientId !== input.patientId)
      await checkPatient(tx, actor.organizationId, input.patientId);
    const values = rescheduled
      ? {
          ...(await scheduleValues(tx, actor, input, now, id)),
          status: "SCHEDULED" as const,
        }
      : {
          patientId: input.patientId,
          startsAt: previous.startsAt,
          status: previous.status,
        };

    await tx.appointment.update({
      where: {
        organizationId_id: { organizationId: actor.organizationId, id },
        revision: input.revision,
      },
      data: { ...values, revision: { increment: 1 } },
    });
    await history(
      tx,
      actor,
      id,
      rescheduled ? "RESCHEDULED" : "UPDATED",
      values.status,
      previous.status,
      values.startsAt,
      previous.startsAt,
    );
    return { id };
  });
}

export async function changeAppointmentStatus(
  actor: Actor,
  id: string,
  revision: number,
  status: AppointmentStatus,
  now = new Date(),
) {
  requirePrivilege(actor, "schedules:manage");
  return writeOperation(async (tx) => {
    const previous = await editableAppointment(tx, actor, id, revision);
    if (
      !allowedStatuses(previous.status, previous.startsAt, now).includes(status)
    ) {
      throw new OperationError(
        "A situação selecionada não está disponível para este atendimento.",
        409,
      );
    }
    await tx.appointment.update({
      where: {
        organizationId_id: { organizationId: actor.organizationId, id },
        revision,
      },
      data: { status, revision: { increment: 1 } },
    });
    await history(
      tx,
      actor,
      id,
      "STATUS_CHANGED",
      status,
      previous.status,
      previous.startsAt,
    );
    return { id };
  });
}

async function editableAppointment(
  tx: Prisma.TransactionClient,
  actor: Actor,
  id: string,
  revision: number,
) {
  const previous = await tx.appointment.findUnique({
    where: { organizationId_id: { organizationId: actor.organizationId, id } },
  });
  if (!previous) throw missing();
  if (previous.revision !== revision)
    throw new OperationError(
      "O agendamento mudou. Recarregue a página e tente novamente.",
      409,
    );
  if (!isOpenStatus(previous.status))
    throw new OperationError("Este atendimento já foi encerrado.", 409);
  return previous;
}

async function history(
  tx: Prisma.TransactionClient,
  actor: Actor,
  appointmentId: string,
  event: "CREATED" | "UPDATED" | "RESCHEDULED" | "STATUS_CHANGED",
  toStatus: AppointmentStatus,
  fromStatus: AppointmentStatus | null,
  startsAt: Date,
  previousStartsAt?: Date,
) {
  await tx.appointmentStatusHistory.create({
    data: {
      organizationId: actor.organizationId,
      appointmentId,
      actorId: actor.id,
      event,
      fromStatus,
      toStatus,
      previousStartsAt,
      startsAt,
    },
  });
  await audit(tx, actor, "Appointment", appointmentId, event);
}
