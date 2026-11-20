import { createHmac } from "node:crypto";
import { database } from "../db";

type Operation = "login" | "request-reset" | "apply-reset" | "demo";

const limits = {
  login: { global: 120, account: 8, seconds: 900 },
  "request-reset": { global: 60, account: 4, seconds: 900 },
  "apply-reset": { global: 60, account: 5, seconds: 900 },
  demo: { global: 180, account: 180, seconds: 900 },
} satisfies Record<
  Operation,
  { global: number; account: number; seconds: number }
>;

export async function allowAttempt(operation: Operation, identity: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET não configurada.");
  const limit = limits[operation];

  const increment = async (scope: string, maximum: number) => {
    const key = createHmac("sha256", secret)
      .update(`${operation}:${scope}`)
      .digest("hex");
    const rows = await database().$queryRaw<{ hits: number }[]>`
      INSERT INTO "AuthRateLimit" ("key", "hits", "expiresAt")
      VALUES (${key}, 1, now() + ${limit.seconds} * interval '1 second')
      ON CONFLICT ("key") DO UPDATE SET
        "hits" = CASE WHEN "AuthRateLimit"."expiresAt" <= now() THEN 1
                      ELSE LEAST("AuthRateLimit"."hits" + 1, ${maximum + 1}) END,
        "expiresAt" = CASE WHEN "AuthRateLimit"."expiresAt" <= now()
                           THEN EXCLUDED."expiresAt" ELSE "AuthRateLimit"."expiresAt" END
      RETURNING "hits"
    `;
    return rows[0].hits <= maximum;
  };

  return (
    (await increment("global", limit.global)) &&
    increment(`identity:${identity}`, limit.account)
  );
}
