import "dotenv/config";
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { database } from "../../src/server/db";
import {
  changeAppointmentStatus,
  createAppointment,
  updateAppointment,
} from "../../src/server/operations/appointments";
import { availableSlots } from "../../src/server/operations/slots";

describe.runIf(process.env.RUN_DB_TESTS === "true")(
  "agendamento concorrente no PostgreSQL",
  () => {
    afterAll(async () => database().$disconnect());

    it("deduplica reenvio, previne sobreposição e registra mudanças confirmadas", async () => {
      const db = database();
      const organization = await db.organization.findUniqueOrThrow({
        where: { slug: "clinica-vida-plena" },
      });
      const member = await db.user.findFirstOrThrow({
        where: { organizationId: organization.id, role: "ADMIN" },
      });
      const actor = { ...member, organization, professional: null };
      const professional = await db.professional.findFirstOrThrow({
        where: {
          organizationId: organization.id,
          active: true,
          availability: { some: { weekday: 1 } },
        },
      });
      const patient = await db.patient.findFirstOrThrow({
        where: { organizationId: organization.id, archivedAt: null },
      });
      const service = await db.service.findFirstOrThrow({
        where: {
          organizationId: organization.id,
          specialtyId: professional.specialtyId,
          durationMinutes: { lte: 60 },
        },
      });
      const [sameKey, conflictKey, firstKey, secondKey, badKey] = Array.from(
        { length: 5 },
        () => randomUUID(),
      );
      const keys = [sameKey, conflictKey, firstKey, secondKey, badKey];
      const input = {
        requestKey: sameKey,
        patientId: patient.id,
        professionalId: professional.id,
        serviceId: service.id,
        day: "2031-06-02",
        time: "08:00",
      };
      const now = new Date("2031-06-02T09:00:00Z");

      try {
        const results = await Promise.all([
          createAppointment(actor, input, now),
          createAppointment(actor, input, now),
        ]);
        expect(results[0].id).toBe(results[1].id);
        expect(results.filter(({ replayed }) => replayed)).toHaveLength(1);
        const id = results[0].id;
        await expect(
          createAppointment(
            actor,
            { ...input, time: "07:00", requestKey: badKey },
            now,
          ),
        ).rejects.toMatchObject({ status: 400 });
        await expect(
          createAppointment(actor, { ...input, time: "10:00" }, now),
        ).rejects.toMatchObject({ status: 409 });
        await expect(
          createAppointment(actor, { ...input, requestKey: conflictKey }, now),
        ).rejects.toMatchObject({ status: 409 });

        const competing = await Promise.allSettled(
          [firstKey, secondKey].map((requestKey) =>
            createAppointment(
              actor,
              { ...input, time: "11:00", requestKey },
              now,
            ),
          ),
        );
        expect(
          competing.filter(({ status }) => status === "fulfilled"),
        ).toHaveLength(1);
        expect(
          competing.find(({ status }) => status === "rejected"),
        ).toMatchObject({ status: "rejected", reason: { status: 409 } });
        const free = await availableSlots(
          organization.id,
          organization.timezone,
          input,
          now,
        );
        expect(free).not.toContain("08:00");
        expect(free).toContain("09:30");

        await expect(
          changeAppointmentStatus(actor, id, 0, "COMPLETED", now),
        ).rejects.toMatchObject({ status: 409 });
        await changeAppointmentStatus(actor, id, 0, "CONFIRMED", now);
        await expect(
          updateAppointment(
            actor,
            id,
            { ...input, time: "09:30", revision: 0 },
            now,
          ),
        ).rejects.toMatchObject({ status: 409 });
        await updateAppointment(
          actor,
          id,
          { ...input, time: "09:30", revision: 1 },
          now,
        );
        await changeAppointmentStatus(actor, id, 2, "CANCELLED", now);
        const saved = await db.appointment.findUniqueOrThrow({
          where: { id },
          include: { history: true },
        });
        expect(saved.startsAt.toISOString()).toBe("2031-06-02T12:30:00.000Z");
        expect(saved.status).toBe("CANCELLED");
        expect(saved.revision).toBe(3);
        expect(saved.history.map(({ event }) => event).sort()).toEqual([
          "CREATED",
          "RESCHEDULED",
          "STATUS_CHANGED",
          "STATUS_CHANGED",
        ]);
        expect(
          await db.auditLog.count({
            where: { organizationId: organization.id, entityId: id },
          }),
        ).toBe(4);
      } finally {
        const rows = await db.appointment.findMany({
          where: { organizationId: organization.id, requestKey: { in: keys } },
          select: { id: true },
        });
        const ids = rows.map(({ id }) => id);
        await db.$transaction([
          db.auditLog.deleteMany({
            where: {
              organizationId: organization.id,
              entity: "Appointment",
              entityId: { in: ids },
            },
          }),
          db.appointmentStatusHistory.deleteMany({
            where: {
              organizationId: organization.id,
              appointmentId: { in: ids },
            },
          }),
          db.appointment.deleteMany({
            where: { organizationId: organization.id, id: { in: ids } },
          }),
        ]);
      }
    });
  },
);
