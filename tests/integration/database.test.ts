import "dotenv/config";
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { allowAttempt } from "../../src/server/auth/rate-limit";
import { database } from "../../src/server/db";

describe.runIf(process.env.RUN_DB_TESTS === "true")(
  "integridade no PostgreSQL",
  () => {
    afterAll(async () => database().$disconnect());

    it("impede que um profissional use a especialidade de outra clínica", async () => {
      const db = database();
      const left = randomUUID();
      const right = randomUUID();
      await expect(
        db.$transaction(async (tx) => {
          await tx.organization.createMany({
            data: [
              { id: left, slug: left, name: "Clínica A" },
              { id: right, slug: right, name: "Clínica B" },
            ],
          });
          const specialty = await tx.specialty.create({
            data: { organizationId: right, name: "Especialidade de teste" },
          });
          await tx.professional.create({
            data: {
              organizationId: left,
              name: "Profissional de teste",
              registration: "TEST-1",
              specialtyId: specialty.id,
              defaultDurationMinutes: 30,
            },
          });
        }),
      ).rejects.toMatchObject({ code: "P2003" });
    });

    it("bloqueia consultas sobrepostas no mesmo profissional e aceita horários contíguos", async () => {
      const db = database();
      const slug = randomUUID();
      let creationCount = 0;
      await expect(
        db.$transaction(async (tx) => {
          const { id: organizationId } = await tx.organization.create({
            data: { slug, name: "Clínica de teste" },
          });
          const { id: specialtyId } = await tx.specialty.create({
            data: { organizationId, name: "Clínica Geral" },
          });
          const { id: professionalId } = await tx.professional.create({
            data: {
              organizationId,
              name: "Profissional",
              registration: "TEST-2",
              specialtyId,
              defaultDurationMinutes: 30,
            },
          });
          const { id: patientId } = await tx.patient.create({
            data: {
              organizationId,
              name: "Paciente",
              birthDate: new Date("1990-01-01"),
              internalCode: "PAC-001",
            },
          });
          const { id: serviceId } = await tx.service.create({
            data: {
              organizationId,
              specialtyId,
              name: "Atendimento",
              description: "Teste",
              durationMinutes: 30,
              priceCents: 10000,
            },
          });
          const scope = {
            organizationId,
            professionalId,
            patientId,
            serviceId,
            priceCents: 10000,
          };
          const at = (time: string) => new Date(`2026-11-19T${time}:00-03:00`);
          await tx.appointment
            .createMany({
              data: [
                { ...scope, startsAt: at("09:00"), endsAt: at("09:30") },
                { ...scope, startsAt: at("09:30"), endsAt: at("10:00") },
                {
                  ...scope,
                  startsAt: at("09:15"),
                  endsAt: at("09:45"),
                  status: "CANCELLED",
                },
              ],
            })
            .then(({ count }) => {
              creationCount = count;
            });
          await tx.appointment.create({
            data: { ...scope, startsAt: at("09:15"), endsAt: at("09:45") },
          });
        }),
      ).rejects.toThrow("appointment_professional_no_overlap");
      expect(creationCount).toBe(3);
    });

    it("aplica o limite de login mesmo com requisições simultâneas", async () => {
      const identity = `${randomUUID()}@clinicflow.example`;
      const results = await Promise.all(
        Array.from({ length: 12 }, () => allowAttempt("login", identity)),
      );
      expect(results.filter(Boolean)).toHaveLength(8);
    });
  },
);
