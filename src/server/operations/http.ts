import { ZodError } from "zod";
import { currentActor } from "@/server/auth/access";
import { OperationError, type Actor } from "./core";

export function operationMessage(error: unknown) {
  if (error instanceof OperationError) return error.message;
  if (error instanceof ZodError) {
    const message = error.issues[0]?.message;
    return message && /^(Informe|O início|Os horários|Escolha)/.test(message)
      ? message
      : "Confira os campos obrigatórios e o formato dos valores.";
  }
  console.error("Falha ao executar operação do ClinicFlow.");
  return "Não foi possível concluir a operação. Tente novamente.";
}

export function result(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function operationRequest(
  request: Request,
  handler: (actor: Actor) => Promise<Response>,
) {
  try {
    if (request.method !== "GET" && request.method !== "HEAD") {
      const origin = request.headers.get("origin");
      const appOrigin = new URL(process.env.AUTH_URL || request.url).origin;
      if (origin && origin !== appOrigin)
        throw new OperationError("Origem da solicitação inválida.", 403);
    }
    const actor = await currentActor();
    if (!actor)
      throw new OperationError("Entre para acessar este recurso.", 401);
    return await handler(actor);
  } catch (error) {
    return result(
      { message: operationMessage(error) },
      error instanceof OperationError
        ? error.status
        : error instanceof ZodError
          ? 422
          : 500,
    );
  }
}

export async function jsonBody(request: Request) {
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  ) {
    throw new OperationError("Use o formato application/json.", 415);
  }
  try {
    return (await request.json()) as unknown;
  } catch {
    throw new OperationError("O corpo da solicitação contém JSON inválido.");
  }
}
