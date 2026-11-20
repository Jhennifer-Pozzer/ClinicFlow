import { database } from "../db";
import { verifyPassword } from "./password";
import { allowAttempt } from "./rate-limit";
import { loginSchema } from "./schemas";

export async function authenticate(input: unknown) {
  const result = loginSchema.safeParse(input);
  if (!result.success) return null;

  const { email, password } = result.data;
  if (!(await allowAttempt("login", email))) return null;

  // O e-mail canônico é uma identidade global para o login.
  const user = await database().user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      organizationId: true,
      passwordHash: true,
      active: true,
      sessionVersion: true,
    },
  });
  const valid = await verifyPassword(
    password,
    user?.active ? user.passwordHash : undefined,
  );
  if (!valid || !user?.active) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    organizationId: user.organizationId,
    sessionVersion: user.sessionVersion,
  };
}
