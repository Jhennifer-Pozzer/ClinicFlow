import "dotenv/config";
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { database } from "../../src/server/db";
import { getDashboard } from "../../src/server/dashboard/data";

const now = new Date("2026-11-19T15:00:00Z");

describe.runIf(process.env.RUN_DB_TESTS === "true")(
  "indicadores no PostgreSQL",
  () => {
    afterAll(async () => database().$disconnect());

    it("computa somente a clínica autenticada e usa o dia local", async () => {
      const db = database();
      const organizations = [randomUUID(), randomUUID()];

      try {
        await db.$transaction(async (tx) => {
          for (const [index, organizationId] of organizations.entries()) {
            await tx.organization.create({
              data: {
                id: organizationId,
                slug: organizationId,
                name: "Clínica de teste",
              },
            });
            const specialty = await tx.specialty.create({
              data: { organizationId, name: "Clínica Geral" },
            });
            const professional = await tx.professional.create({
              data: {
                organizationId,
                specialtyId: specialty.id,
                name: "Profissional fictício",
                registration: "TEST",
                defaultDurationMinutes: 30,
              },
            });
            const patient = await tx.patient.create({
              data: {
                organizationId,
                name: `Paciente teste ${index}`,
                birthDate: new Date("1990-01-01"),
                internalCode: "TEST",
                createdAt: now,
              },
            });
            const service = await tx.service.create({
              data: {
                organizationId,
                specialtyId: specialty.id,
                name: "Consulta",
                description: "Teste",
                durationMinutes: 30,
                priceCents: 30050,
              },
            });
            const scope = {
              organizationId,
              professionalId: professional.id,
              patientId: patient.id,
              serviceId: service.id,
              priceCents: 30050,
            };
            await tx.appointment.createMany({
              data: [
                {
                  ...scope,
                  startsAt: new Date("2026-11-19T01:30:00Z"),
                  endsAt: new Date("2026-11-19T02:00:00Z"),
                  status: "COMPLETED",
                },
                {
                  ...scope,
                  startsAt: now,
                  endsAt: new Date("2026-11-19T15:30:00Z"),
                  status: "SCHEDULED",
                },
              ],
            });
            const category = await tx.financialCategory.create({
              data: { organizationId, name: "Consultas", type: "RECEIVABLE" },
            });
            await tx.financialTransaction.create({
              data: {
                organizationId,
                categoryId: category.id,
                description: "Recebimento",
                type: "RECEIVABLE",
                status: "SETTLED",
                amountCents: index === 0 ? 30050 : 99900,
                dueDate: new Date("2026-11-19"),
                settledAt: now,
                paymentMethod: "PIX",
              },
            });
          }
        });

        const actor = {
          id: randomUUID(),
          name: "Administrador",
          email: "admin@teste.example",
          organizationId: organizations[0],
          organization: {
            name: "Clínica de teste",
            timezone: "America/Sao_Paulo",
            isDemo: false,
          },
          role: "ADMIN" as const,
          professional: null,
        };
        const data = await getDashboard(actor, "7", now);
        expect(data.todayCount).toBe(1);
        expect(data.todayRows[0]?.startsAt.toISOString()).toBe(
          now.toISOString(),
        );
        expect(data.todayRows.map(({ patient }) => patient.name)).toEqual([
          "Paciente teste 0",
        ]);
        expect(data.upcoming.map(({ patient }) => patient.name)).toEqual([
          "Paciente teste 0",
        ]);
        expect(data.statusCounts).toMatchObject({ COMPLETED: 1, SCHEDULED: 1 });
        expect(data.evolution.slice(-2)).toEqual([
          { day: "2026-11-18", count: 1 },
          { day: "2026-11-19", count: 1 },
        ]);
        expect(data.specialties).toEqual([{ name: "Clínica Geral", count: 2 }]);
        expect(data.patients).toBe(1);
        expect(data.finance?.received).toBe(30050);

        const unlinked = await getDashboard(
          { ...actor, role: "PROFESSIONAL" },
          "7",
          now,
        );
        expect(unlinked.todayRows).toEqual([]);
        expect(unlinked.upcoming).toEqual([]);
        expect(unlinked.finance).toBeNull();
        expect(unlinked.patients).toBeNull();
      } finally {
        const where = { organizationId: { in: organizations } };
        await db.$transaction([
          db.financialTransaction.deleteMany({ where }),
          db.financialCategory.deleteMany({ where }),
          db.appointment.deleteMany({ where }),
          db.service.deleteMany({ where }),
          db.professional.deleteMany({ where }),
          db.patient.deleteMany({ where }),
          db.specialty.deleteMany({ where }),
          db.organization.deleteMany({ where: { id: { in: organizations } } }),
        ]);
      }
    });
  },
);
