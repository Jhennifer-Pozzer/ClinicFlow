import { database } from "../db";
import { allowAttempt } from "./rate-limit";

export async function authenticateDemo() {
  if (process.env.DEMO_ACCESS_ENABLED !== "true") return null;
  if (!(await allowAttempt("demo", "clinica-vida-plena"))) return null;

  return database().user.findFirst({
    where: {
      email: "admin@clinicflow.example",
      active: true,
      role: "ADMIN",
      organization: { isDemo: true, slug: "clinica-vida-plena" },
    },
    select: {
      id: true,
      name: true,
      email: true,
      organizationId: true,
      sessionVersion: true,
    },
  });
}
