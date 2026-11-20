import { isDirectoryKind } from "@/lib/operations";
import {
  listDirectory,
  readDirectoryFilters,
  saveDirectory,
} from "@/server/operations/directory";
import { missing } from "@/server/operations/core";
import { jsonBody, operationRequest, result } from "@/server/operations/http";

export function GET(
  request: Request,
  context: RouteContext<"/api/v1/[resource]">,
) {
  return operationRequest(request, async (actor) => {
    const { resource } = await context.params;
    if (!isDirectoryKind(resource)) throw missing();
    return result(
      await listDirectory(
        actor,
        resource,
        readDirectoryFilters(
          Object.fromEntries(new URL(request.url).searchParams),
        ),
      ),
    );
  });
}

export function POST(
  request: Request,
  context: RouteContext<"/api/v1/[resource]">,
) {
  return operationRequest(request, async (actor) => {
    const { resource } = await context.params;
    if (!isDirectoryKind(resource)) throw missing();
    return result(
      await saveDirectory(actor, resource, await jsonBody(request)),
      201,
    );
  });
}
