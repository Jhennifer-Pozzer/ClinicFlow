import { createHash, randomBytes } from "node:crypto";
import { database } from "../db";
import { sendPasswordRecovery } from "./mail";
import { hashPassword } from "./password";
import { allowAttempt } from "./rate-limit";

function digest(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function issuePasswordReset(email: string) {
  const db = database();
  const user = await db.user.findUnique({
    where: { email, active: true },
    select: { id: true, organizationId: true, sessionVersion: true },
  });
  if (!user) return;

  const token = randomBytes(32).toString("hex");
  const data = {
    tokenHash: digest(token),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    createdAt: new Date(),
    sessionVersion: user.sessionVersion,
  };
  const scope = { organizationId: user.organizationId, userId: user.id };
  await db.passwordResetToken.upsert({
    where: { organizationId_userId: scope },
    create: { ...scope, ...data },
    update: data,
  });
  try {
    await sendPasswordRecovery(email, token);
  } catch (error) {
    await db.passwordResetToken.deleteMany({
      where: { ...scope, tokenHash: data.tokenHash },
    });
    throw error;
  }
}

export async function applyPasswordReset(token: string, password: string) {
  const tokenHash = digest(token);
  if (!(await allowAttempt("apply-reset", tokenHash))) return false;

  const db = database();
  const candidate = await db.passwordResetToken.findUnique({
    where: { tokenHash, expiresAt: { gt: new Date() } },
  });
  if (!candidate) return false;
  const passwordHash = await hashPassword(password);

  return db.$transaction(async (tx) => {
    const { id, userId, organizationId, sessionVersion } = candidate;
    const consumed = await tx.passwordResetToken.deleteMany({
      where: { id, organizationId, tokenHash, expiresAt: { gt: new Date() } },
    });
    if (consumed.count !== 1) return false;

    const updated = await tx.user.updateMany({
      where: { id: userId, organizationId, sessionVersion, active: true },
      data: { passwordHash, sessionVersion: { increment: 1 } },
    });
    if (updated.count !== 1) return false;

    await tx.auditLog.create({
      data: {
        organizationId,
        actorId: userId,
        action: "PASSWORD_RESET",
        entity: "User",
        entityId: userId,
      },
    });
    return true;
  });
}
