import { calendarFilters, readCalendar } from "@/server/operations/calendar";
import { createAppointment } from "@/server/operations/appointments";
import { jsonBody, operationRequest, result } from "@/server/operations/http";
import { bookingCreateSchema } from "@/server/operations/schemas";

export function GET(request: Request) {
  return operationRequest(request, async (actor) => {
    return result(
      await readCalendar(
        actor,
        calendarFilters(
          actor,
          Object.fromEntries(new URL(request.url).searchParams),
        ),
      ),
    );
  });
}

export function POST(request: Request) {
  return operationRequest(request, async (actor) => {
    const created = await createAppointment(
      actor,
      bookingCreateSchema.parse(await jsonBody(request)),
    );
    return result(created, created.replayed ? 200 : 201);
  });
}
