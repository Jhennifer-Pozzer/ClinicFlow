import { Role } from "../../generated/prisma/enums";

const permissions = {
  ADMIN: [
    "workspace:read",
    "patients:manage",
    "catalog:manage",
    "schedules:manage",
    "finance:manage",
    "reports:read",
    "organization:manage",
    "users:manage",
    "audit:read",
  ],
  RECEPTIONIST: ["workspace:read", "patients:manage", "schedules:manage"],
  PROFESSIONAL: ["workspace:read", "own-schedule:read"],
} as const satisfies Record<Role, readonly string[]>;

export type Permission = (typeof permissions)[Role][number];

export function can(role: Role, permission: Permission) {
  const allowed: readonly Permission[] = permissions[role];
  return allowed.includes(permission);
}

export const roleLabels: Record<Role, string> = {
  ADMIN: "Administrador",
  RECEPTIONIST: "Recepcionista",
  PROFESSIONAL: "Profissional de saúde",
};
