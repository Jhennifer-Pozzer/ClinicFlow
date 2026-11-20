import { requirePrivilege } from "@/server/operations/core";
import { operationRequest, result } from "@/server/operations/http";
import { bookingSlotsSchema } from "@/server/operations/schemas";
import { availableSlots } from "@/server/operations/slots";

export function GET(request: Request) {
  return operationRequest(request, async (actor) => {
    requirePrivilege(actor, "schedules:manage");
    const input = bookingSlotsSchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    return result({
      slots: await availableSlots(
        actor.organizationId,
        actor.organization.timezone,
        input,
      ),
    });
  });
}
