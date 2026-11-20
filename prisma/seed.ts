import "dotenv/config";
import { randomUUID } from "node:crypto";
import { AppointmentStatus, Role } from "../src/generated/prisma/enums";
import { database } from "../src/server/db";
import { hashPassword } from "../src/server/auth/password";
import { newPassword } from "../src/server/auth/schemas";
import {
  patientNames,
  professionals,
  services,
  specialties,
} from "./demo-data";

const slug = "clinica-vida-plena";
const timezone = "America/Sao_Paulo";
const domain = "clinicflow.example";

async function seed() {
  const password = newPassword.safeParse(process.env.DEMO_PASSWORD);
  if (process.env.ALLOW_DEMO_SEED !== "true" || !password.success) {
    throw new Error(
      "Use um banco de demonstração e configure ALLOW_DEMO_SEED e DEMO_PASSWORD.",
    );
  }

  const db = database();
  return db.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT 1::int FROM pg_advisory_xact_lock(736021)`;
      const existing = await tx.organization.findUnique({ where: { slug } });
      if (existing?.isDemo) return false;
      if (existing)
        throw new Error(
          "O identificador da clínica demonstrativa já está em uso.",
        );
      if (await tx.organization.count())
        throw new Error("O seed exige um banco exclusivo para a demonstração.");

      const clinic = await tx.organization.create({
        data: {
          slug,
          name: "Clínica Vida Plena",
          email: `contato@${domain}`,
          timezone,
          isDemo: true,
          openingHours: [1, 2, 3, 4, 5].map((weekday) => ({
            weekday,
            startMinute: 480,
            endMinute: 1080,
          })),
        },
      });
      const organizationId = clinic.id;

      const users = [
        {
          id: randomUUID(),
          username: "admin",
          name: "Alice Sales",
          role: Role.ADMIN,
        },
        {
          id: randomUUID(),
          username: "recepcao1",
          name: "Beatriz Lima",
          role: Role.RECEPTIONIST,
        },
        {
          id: randomUUID(),
          username: "recepcao2",
          name: "João Reis",
          role: Role.RECEPTIONIST,
        },
        ...professionals.map((name, index) => ({
          id: randomUUID(),
          username: `profissional${index + 1}`,
          name,
          role: Role.PROFESSIONAL,
        })),
      ];
      await tx.user.createMany({
        data: await Promise.all(
          users.map(async ({ username, ...user }) => ({
            ...user,
            organizationId,
            email: `${username}@${domain}`,
            passwordHash: await hashPassword(password.data),
          })),
        ),
      });

      const specialtyRows = specialties.map((name) => ({
        id: randomUUID(),
        organizationId,
        name,
      }));
      await tx.specialty.createMany({ data: specialtyRows });

      const professionalRows = professionals.map((name, index) => ({
        id: randomUUID(),
        organizationId,
        name,
        userId: users[index + 3].id,
        email: `${users[index + 3].username}@${domain}`,
        specialtyId: specialtyRows[index].id,
        registration: `DEMO-${index + 1}`,
        defaultDurationMinutes: 30,
      }));
      await tx.professional.createMany({ data: professionalRows });
      await tx.professionalAvailability.createMany({
        data: professionalRows.flatMap(({ id: professionalId }) =>
          [1, 2, 3, 4, 5].flatMap((weekday) => [
            {
              organizationId,
              professionalId,
              weekday,
              startMinute: 480,
              endMinute: 720,
            },
            {
              organizationId,
              professionalId,
              weekday,
              startMinute: 780,
              endMinute: 1080,
            },
          ]),
        ),
      });

      const serviceRows = services.map(
        ([specialty, name, durationMinutes, priceCents]) => ({
          id: randomUUID(),
          organizationId,
          specialtyId: specialtyRows[specialty].id,
          name,
          description: `${name} usada no ambiente de demonstração.`,
          durationMinutes,
          priceCents,
        }),
      );
      await tx.service.createMany({ data: serviceRows });

      const patients = patientNames.map((name, index) => ({
        id: randomUUID(),
        organizationId,
        name,
        internalCode: `PAC-${String(index + 1).padStart(3, "0")}`,
        birthDate: new Date(
          Date.UTC(1961 + index, index % 12, (index % 25) + 1),
        ),
        email: `paciente${index + 1}@${domain}`,
        archivedAt: index === patientNames.length - 1 ? new Date() : null,
      }));
      await tx.patient.createMany({ data: patients });

      const adminId = users[0].id;
      const now = new Date();
      const today = new Date(
        new Intl.DateTimeFormat("sv-SE", { timeZone: timezone }).format(now),
      );
      const appointments = Array.from({ length: 71 }, (_, index) => {
        const date = new Date(today);
        date.setUTCDate(date.getUTCDate() + index - 60);
        return date;
      })
        .filter((date) => date.getUTCDay() >= 1 && date.getUTCDay() <= 5)
        .flatMap((date, day) => {
          const shortDate = date.toISOString().slice(0, 10);
          return Array.from({ length: 3 }, (_, slot) => {
            const professional =
              professionalRows[(day + slot) % professionalRows.length];
            const eligible = serviceRows.filter(
              ({ specialtyId }) => specialtyId === professional.specialtyId,
            );
            const service = eligible[(day + slot) % eligible.length];
            const startsAt = new Date(
              `${shortDate}T${["09", "10", "14"][slot]}:00:00-03:00`,
            );
            const endsAt = new Date(
              startsAt.getTime() + service.durationMinutes * 60_000,
            );
            const past = endsAt < now;
            const status =
              (day + slot) % 11 === 0
                ? AppointmentStatus.CANCELLED
                : past
                  ? (day + slot) % 7 === 0
                    ? AppointmentStatus.NO_SHOW
                    : AppointmentStatus.COMPLETED
                  : slot === 0
                    ? AppointmentStatus.CONFIRMED
                    : AppointmentStatus.SCHEDULED;
            return {
              id: randomUUID(),
              organizationId,
              professionalId: professional.id,
              serviceId: service.id,
              patientId: patients[(day * 3 + slot) % (patients.length - 1)].id,
              startsAt,
              endsAt,
              status,
              priceCents: service.priceCents,
            };
          });
        });

      await tx.appointment.createMany({ data: appointments });
      await tx.appointmentStatusHistory.createMany({
        data: appointments.flatMap(
          ({ id: appointmentId, status, startsAt }) => {
            const scope = { organizationId, appointmentId, actorId: adminId };
            const created = {
              ...scope,
              event: "CREATED" as const,
              startsAt,
              toStatus: AppointmentStatus.SCHEDULED,
            };
            return status === AppointmentStatus.SCHEDULED
              ? [created]
              : [
                  created,
                  {
                    ...scope,
                    fromStatus: AppointmentStatus.SCHEDULED,
                    toStatus: status,
                  },
                ];
          },
        ),
      });

      const revenue = await tx.financialCategory.create({
        data: { organizationId, name: "Consultas", type: "RECEIVABLE" },
      });
      const expense = await tx.financialCategory.create({
        data: { organizationId, name: "Operação", type: "PAYABLE" },
      });

      await tx.financialTransaction.createMany({
        data: appointments
          .filter(({ status }) => status === "COMPLETED")
          .map((appointment, index) => ({
            organizationId,
            categoryId: revenue.id,
            appointmentId: appointment.id,
            description: "Atendimento demonstrativo",
            type: "RECEIVABLE",
            amountCents: appointment.priceCents,
            dueDate: new Date(appointment.startsAt.toISOString().slice(0, 10)),
            status: index % 5 === 0 ? "PENDING" : "SETTLED",
            settledAt: index % 5 === 0 ? null : appointment.endsAt,
            paymentMethod: index % 5 === 0 ? null : "PIX",
          })),
      });
      await tx.financialTransaction.createMany({
        data: Array.from({ length: 4 }, (_, index) => ({
          organizationId,
          categoryId: expense.id,
          description: "Despesa operacional demonstrativa",
          type: "PAYABLE",
          amountCents: 26000 + 15000 * index,
          dueDate: new Date(today.getTime() - (index - 1) * 86_400_000),
        })),
      });

      await tx.auditLog.create({
        data: {
          organizationId,
          actorId: adminId,
          action: "DEMO_SEEDED",
          entity: "Organization",
          entityId: organizationId,
        },
      });
      return true;
    },
    { timeout: 30_000 },
  );
}

seed()
  .then((created) =>
    console.log(
      created
        ? "Clínica demonstrativa criada."
        : "Clínica demonstrativa já existente.",
    ),
  )
  .catch((error: unknown) => {
    const message =
      error instanceof Error ? error.message.split("\n")[0] : "Erro inesperado";
    console.error("Seed encerrado:", message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (process.env.DATABASE_URL) await database().$disconnect();
  });
