import { readAppointment } from "@/server/operations/calendar";
import {
  changeAppointmentStatus,
  updateAppointment,
} from "@/server/operations/appointments";
import { missing } from "@/server/operations/core";
import { jsonBody, operationRequest, result } from "@/server/operations/http";
import {
  bookingStatusSchema,
  bookingUpdateSchema,
  recordId,
} from "@/server/operations/schemas";

export function GET(
  request: Request,
  context: RouteContext<"/api/v1/agenda/[id]">,
) {
  return operationRequest(request, async (actor) => {
    const { id } = await context.params;
    if (!recordId.safeParse(id).success) throw missing();
    return result(await readAppointment(actor, id));
  });
}

export function PUT(
  request: Request,
  context: RouteContext<"/api/v1/agenda/[id]">,
) {
  return operationRequest(request, async (actor) => {
    const { id } = await context.params;
    if (!recordId.safeParse(id).success) throw missing();
    return result(
      await updateAppointment(
        actor,
        id,
        bookingUpdateSchema.parse(await jsonBody(request)),
      ),
    );
  });
}

export function PATCH(
  request: Request,
  context: RouteContext<"/api/v1/agenda/[id]">,
) {
  return operationRequest(request, async (actor) => {
    const { id } = await context.params;
    if (!recordId.safeParse(id).success) throw missing();
    const { revision, status } = bookingStatusSchema.parse(
      await jsonBody(request),
    );
    return result(await changeAppointmentStatus(actor, id, revision, status));
  });
}
