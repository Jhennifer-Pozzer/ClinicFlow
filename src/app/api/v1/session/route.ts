import { authorize } from "@/server/auth/access";

export async function GET() {
  const result = await authorize("workspace:read");
  return Response.json(
    result.status === 200
      ? { user: result.actor }
      : { message: "Sessão necessária." },
    { status: result.status, headers: { "Cache-Control": "no-store" } },
  );
}
