import { Prisma } from "@/generated/prisma/client";
import { can, type Permission } from "@/server/auth/permissions";
import type { currentActor } from "@/server/auth/access";
import { database } from "@/server/db";

export type Actor = NonNullable<Awaited<ReturnType<typeof currentActor>>>;

export class OperationError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

export function requirePrivilege(actor: Actor, permission: Permission) {
  if (!can(actor.role, permission))
    throw new OperationError("Você não tem acesso a este recurso.", 403);
}

export function missing() {
  return new OperationError("Registro não encontrado.", 404);
}

export async function writeOperation<T>(
  work: (tx: Prisma.TransactionClient) => Promise<T>,
) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await database().$transaction(work, {
        isolationLevel: "Serializable",
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034"
      ) {
        if (attempt < 2) continue;
        throw new OperationError(
          "O registro foi alterado. Atualize a página e tente novamente.",
          409,
        );
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new OperationError(
          "Já existe um registro com este identificador ou nome.",
          409,
        );
      }
      if (
        error instanceof Error &&
        (error.message.includes("appointment_professional_no_overlap") ||
          (error instanceof Prisma.PrismaClientKnownRequestError &&
            error.meta?.code === "23P01"))
      ) {
        throw new OperationError(
          "O profissional já tem um atendimento neste horário.",
          409,
        );
      }
      throw error;
    }
  }
}

export function audit(
  tx: Prisma.TransactionClient,
  actor: Actor,
  entity: string,
  entityId: string,
  action: string,
) {
  return tx.auditLog.create({
    data: {
      organizationId: actor.organizationId,
      actorId: actor.id,
      entity,
      entityId,
      action,
    },
  });
}
