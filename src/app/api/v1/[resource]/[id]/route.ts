import { isDirectoryKind } from "@/lib/operations";
import { readDirectory, saveDirectory } from "@/server/operations/directory";
import { missing } from "@/server/operations/core";
import { jsonBody, operationRequest, result } from "@/server/operations/http";
import { recordId } from "@/server/operations/schemas";

export function GET(
  request: Request,
  context: RouteContext<"/api/v1/[resource]/[id]">,
) {
  return operationRequest(request, async (actor) => {
    const { resource, id } = await context.params;
    if (!isDirectoryKind(resource) || !recordId.safeParse(id).success)
      throw missing();
    return result(await readDirectory(actor, resource, id));
  });
}

export function PUT(
  request: Request,
  context: RouteContext<"/api/v1/[resource]/[id]">,
) {
  return operationRequest(request, async (actor) => {
    const { resource, id } = await context.params;
    if (!isDirectoryKind(resource) || !recordId.safeParse(id).success)
      throw missing();
    return result(
      await saveDirectory(actor, resource, await jsonBody(request), id),
    );
  });
}
