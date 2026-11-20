import type { Prisma } from "@/generated/prisma/client";
import { brl } from "@/lib/format";
import { directory, minuteLabel, type DirectoryKind } from "@/lib/operations";
import { database } from "@/server/db";
import {
  audit,
  missing,
  OperationError,
  requirePrivilege,
  writeOperation,
  type Actor,
} from "./core";
import { asMinute, directorySchemas } from "./schemas";
import type { z } from "zod";

const pageSize = 12;
export type DirectoryFilters = {
  q: string;
  status: "active" | "inactive" | "all";
  page: number;
};
type DirectoryRow = {
  id: string;
  name: string;
  detail: string;
  extra: string;
  active: boolean;
};
export type DirectoryForm = {
  name: string;
  active: boolean;
  fields: Record<string, string>;
  availability?: { weekday: number; start: string; end: string }[];
};
const entities = {
  pacientes: "Patient",
  profissionais: "Professional",
  especialidades: "Specialty",
  servicos: "Service",
};

export function readDirectoryFilters(
  params: Record<string, unknown>,
): DirectoryFilters {
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 80) : "";
  const page = typeof params.pagina === "string" ? Number(params.pagina) : 1;
  return {
    q,
    status:
      params.status === "inactive" || params.status === "all"
        ? params.status
        : "active",
    page: Number.isInteger(page) && page > 0 ? Math.min(1000, page) : 1,
  };
}

export async function listDirectory(
  actor: Actor,
  kind: DirectoryKind,
  filters: DirectoryFilters,
) {
  requirePrivilege(actor, directory[kind].permission);
  const db = database();
  const org = actor.organizationId;
  const name = filters.q
    ? { contains: filters.q, mode: "insensitive" as const }
    : undefined;
  const active =
    filters.status === "all" ? undefined : filters.status === "active";
  const pagination = {
    take: pageSize,
    skip: pageSize * (filters.page - 1),
    orderBy: [{ name: "asc" as const }, { id: "asc" as const }],
  };

  if (kind === "pacientes") {
    const where = {
      organizationId: org,
      name,
      archivedAt:
        active === undefined ? undefined : active ? null : { not: null },
    };
    const [count, records] = await db.$transaction([
      db.patient.count({ where }),
      db.patient.findMany({
        where,
        ...pagination,
        select: {
          id: true,
          name: true,
          internalCode: true,
          email: true,
          phone: true,
          archivedAt: true,
        },
      }),
    ]);
    const rows: DirectoryRow[] = records.map((r) => ({
      id: r.id,
      name: r.name,
      detail: r.internalCode,
      extra: r.phone ?? r.email ?? "—",
      active: !r.archivedAt,
    }));
    return { rows, count, pageSize };
  }
  const where = { organizationId: org, name, active };
  if (kind === "profissionais") {
    const [count, records] = await db.$transaction([
      db.professional.count({ where }),
      db.professional.findMany({
        where,
        ...pagination,
        select: {
          id: true,
          name: true,
          specialty: { select: { name: true } },
          registration: true,
          active: true,
        },
      }),
    ]);
    return {
      rows: records.map((r) => ({
        id: r.id,
        name: r.name,
        detail: r.specialty.name,
        extra: r.registration,
        active: r.active,
      })),
      count,
      pageSize,
    };
  }
  if (kind === "servicos") {
    const [count, records] = await db.$transaction([
      db.service.count({ where }),
      db.service.findMany({
        where,
        ...pagination,
        select: {
          id: true,
          name: true,
          specialty: { select: { name: true } },
          durationMinutes: true,
          priceCents: true,
          active: true,
        },
      }),
    ]);
    return {
      rows: records.map((r) => ({
        id: r.id,
        name: r.name,
        detail: r.specialty.name,
        extra: `${r.durationMinutes} min · ${brl(r.priceCents)}`,
        active: r.active,
      })),
      count,
      pageSize,
    };
  }
  const [count, records] = await db.$transaction([
    db.specialty.count({ where }),
    db.specialty.findMany({
      where,
      ...pagination,
      select: { id: true, name: true, active: true },
    }),
  ]);
  return {
    rows: records.map((r) => ({ ...r, detail: "", extra: "" })),
    count,
    pageSize,
  };
}

export async function readDirectory(
  actor: Actor,
  kind: DirectoryKind,
  id: string,
): Promise<DirectoryForm> {
  requirePrivilege(actor, directory[kind].permission);
  const db = database();
  const where = {
    organizationId_id: { organizationId: actor.organizationId, id },
  };
  if (kind === "pacientes") {
    const r = await db.patient.findUnique({ where });
    if (!r) throw missing();
    return {
      name: r.name,
      active: !r.archivedAt,
      fields: {
        birthDate: r.birthDate.toISOString().slice(0, 10),
        phone: r.phone ?? "",
        email: r.email ?? "",
        internalCode: r.internalCode,
        administrativeNote: r.administrativeNote ?? "",
        createdAt: r.createdAt.toISOString(),
      },
    };
  }
  if (kind === "profissionais") {
    const r = await db.professional.findUnique({
      where,
      include: {
        availability: { orderBy: [{ weekday: "asc" }, { startMinute: "asc" }] },
      },
    });
    if (!r) throw missing();
    return {
      name: r.name,
      active: r.active,
      fields: {
        specialtyId: r.specialtyId,
        phone: r.phone ?? "",
        email: r.email ?? "",
        registration: r.registration,
        userId: r.userId ?? "",
        defaultDurationMinutes: String(r.defaultDurationMinutes),
      },
      availability: r.availability.map((row) => ({
        weekday: row.weekday,
        start: minuteLabel(row.startMinute),
        end: minuteLabel(row.endMinute),
      })),
    };
  }
  if (kind === "servicos") {
    const r = await db.service.findUnique({ where });
    if (!r) throw missing();
    return {
      name: r.name,
      active: r.active,
      fields: {
        description: r.description,
        specialtyId: r.specialtyId,
        durationMinutes: String(r.durationMinutes),
        price: (r.priceCents / 100).toFixed(2).replace(".", ","),
      },
    };
  }
  const r = await db.specialty.findUnique({ where });
  if (!r) throw missing();
  return { name: r.name, active: r.active, fields: {} };
}

export async function directoryOptions(
  actor: Actor,
  kind: DirectoryKind,
  selectedUser: string,
) {
  requirePrivilege(actor, directory[kind].permission);
  if (kind !== "profissionais" && kind !== "servicos")
    return { specialties: [], users: [] };
  const db = database();
  const organizationId = actor.organizationId;
  const [specialties, users] = await Promise.all([
    db.specialty.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, active: true },
    }),
    kind === "profissionais"
      ? db.user.findMany({
          where: {
            organizationId,
            role: "PROFESSIONAL",
            OR: [
              { professional: null, active: true },
              ...(selectedUser ? [{ id: selectedUser }] : []),
            ],
          },
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        })
      : [],
  ]);
  return { specialties, users };
}

export async function patientHistory(
  actor: Actor,
  patientId: string,
  page: number,
) {
  requirePrivilege(actor, "patients:manage");
  const where = { organizationId: actor.organizationId, patientId };
  const db = database();
  const [count, rows] = await db.$transaction([
    db.appointment.count({ where }),
    db.appointment.findMany({
      where,
      take: pageSize,
      skip: (page - 1) * pageSize,
      orderBy: [{ startsAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        startsAt: true,
        status: true,
        service: { select: { name: true } },
        professional: { select: { name: true } },
      },
    }),
  ]);
  return { rows, count, pageSize };
}

export async function saveDirectory(
  actor: Actor,
  kind: DirectoryKind,
  input: unknown,
  id?: string,
) {
  requirePrivilege(actor, directory[kind].permission);
  const organizationId = actor.organizationId;
  const where = id ? { organizationId_id: { organizationId, id } } : undefined;

  return writeOperation(async (tx) => {
    const record = await persist(tx, actor, kind, input, where);
    await audit(
      tx,
      actor,
      entities[kind],
      record.id,
      where ? "UPDATED" : "CREATED",
    );
    return record;
  });
}

type ScopedKey = { organizationId_id: { organizationId: string; id: string } };

async function persist(
  tx: Prisma.TransactionClient,
  actor: Actor,
  kind: DirectoryKind,
  input: unknown,
  where?: ScopedKey,
) {
  const organizationId = actor.organizationId;
  const select = { id: true } as const;
  if (kind === "pacientes") {
    const { birthDate, administrativeNote, active, ...fields } =
      directorySchemas.pacientes.parse(input);
    const today = new Intl.DateTimeFormat("sv-SE", {
      timeZone: actor.organization.timezone,
    }).format(new Date());
    if (birthDate > today)
      throw new OperationError(
        "A data de nascimento não pode estar no futuro.",
      );
    const previous = where
      ? await tx.patient.findUnique({ where, select: { archivedAt: true } })
      : null;
    if (where && !previous) throw missing();
    const data = {
      ...fields,
      birthDate: new Date(birthDate),
      administrativeNote: administrativeNote || null,
      archivedAt: active ? null : (previous?.archivedAt ?? new Date()),
    };
    return where
      ? tx.patient.update({ where, data, select })
      : tx.patient.create({ data: { ...data, organizationId }, select });
  }
  if (kind === "especialidades") {
    const data = directorySchemas.especialidades.parse(input);
    if (where && !(await tx.specialty.findUnique({ where, select })))
      throw missing();
    return where
      ? tx.specialty.update({ where, data, select })
      : tx.specialty.create({ data: { ...data, organizationId }, select });
  }
  if (kind === "servicos") {
    const { price: priceCents, ...data } =
      directorySchemas.servicos.parse(input);
    if (where && !(await tx.service.findUnique({ where, select })))
      throw missing();
    await checkSpecialty(tx, organizationId, data.specialtyId, data.active);
    const values = { ...data, priceCents };
    return where
      ? tx.service.update({ where, data: values, select })
      : tx.service.create({ data: { ...values, organizationId }, select });
  }

  const { availability, ...data } = directorySchemas.profissionais.parse(input);
  if (where && !(await tx.professional.findUnique({ where, select })))
    throw missing();
  await checkSpecialty(tx, organizationId, data.specialtyId, data.active);
  if (data.userId) {
    const user = await tx.user.findFirst({
      where: { organizationId, id: data.userId, role: "PROFESSIONAL" },
      select: { professional: { select: { id: true } } },
    });
    if (
      !user ||
      (user.professional &&
        user.professional.id !== where?.organizationId_id.id)
    ) {
      throw new OperationError(
        "Escolha uma conta de profissional disponível nesta clínica.",
      );
    }
  }
  const r = where
    ? await tx.professional.update({ where, data, select })
    : await tx.professional.create({
        data: { ...data, organizationId },
        select,
      });
  await replaceAvailability(tx, organizationId, r.id, availability);
  return r;
}

async function checkSpecialty(
  tx: Prisma.TransactionClient,
  organizationId: string,
  id: string,
  active: boolean,
) {
  const specialty = await tx.specialty.findUnique({
    where: { organizationId_id: { organizationId, id } },
    select: { active: true },
  });
  if (!specialty || (active && !specialty.active))
    throw new OperationError(
      "Escolha uma especialidade ativa da clínica para um cadastro ativo.",
    );
}

async function replaceAvailability(
  tx: Prisma.TransactionClient,
  organizationId: string,
  professionalId: string,
  availability: z.infer<typeof directorySchemas.profissionais>["availability"],
) {
  await tx.professionalAvailability.deleteMany({
    where: { organizationId, professionalId },
  });
  if (!availability.length) return;
  await tx.professionalAvailability.createMany({
    data: availability.map(({ weekday, start, end }) => ({
      organizationId,
      professionalId,
      weekday,
      startMinute: asMinute(start),
      endMinute: asMinute(end),
    })),
  });
}
