import { auth } from "@/auth";
import { database } from "../db";
import { can, type Permission } from "./permissions";

export async function currentActor() {
  const session = await auth();
  const user = session?.user;
  if (
    !user?.id ||
    !user.organizationId ||
    typeof user.sessionVersion !== "number"
  )
    return null;

  return database().user.findFirst({
    where: {
      id: user.id,
      organizationId: user.organizationId,
      sessionVersion: user.sessionVersion,
      active: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      organizationId: true,
      organization: { select: { name: true, timezone: true, isDemo: true } },
      professional: { select: { id: true, active: true } },
    },
  });
}

export async function authorize(permission: Permission) {
  const actor = await currentActor();
  if (!actor) return { status: 401 } as const;
  if (!can(actor.role, permission)) return { status: 403 } as const;
  return { status: 200, actor } as const;
}
