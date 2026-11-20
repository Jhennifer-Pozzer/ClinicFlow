import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const registry = globalThis as typeof globalThis & {
  clinicflowDb?: PrismaClient;
};

export function database() {
  if (!registry.clinicflowDb) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL não configurada.");
    // O adaptador Prisma normaliza timestamps supondo que a sessão PostgreSQL usa UTC.
    const adapter = new PrismaPg({
      connectionString,
      options: "-c timezone=UTC",
    });
    registry.clinicflowDb = new PrismaClient({ adapter });
  }
  return registry.clinicflowDb;
}
