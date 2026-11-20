"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { DirectoryKind } from "@/lib/operations";
import { directory, isDirectoryKind } from "@/lib/operations";
import { currentActor } from "@/server/auth/access";
import {
  createAppointment,
  updateAppointment,
  changeAppointmentStatus,
} from "@/server/operations/appointments";
import { missing, OperationError } from "@/server/operations/core";
import { saveDirectory } from "@/server/operations/directory";
import { operationMessage } from "@/server/operations/http";
import {
  bookingCreateSchema,
  bookingStatusSchema,
  bookingUpdateSchema,
  recordId,
} from "@/server/operations/schemas";
import { can } from "@/server/auth/permissions";

export type OperationState = { message?: string };

export async function persistDirectory(
  kind: DirectoryKind,
  id: string | null,
  _: OperationState,
  form: FormData,
): Promise<OperationState> {
  let nextId: string;
  try {
    const actor = await currentActor();
    if (!actor)
      throw new OperationError("Faça login novamente para salvar.", 401);
    if (!isDirectoryKind(kind) || (id && !recordId.safeParse(id).success))
      throw missing();
    if (!can(actor.role, directory[kind].permission))
      throw new OperationError("Você não tem acesso a este recurso.", 403);
    const weekdays = form.getAll("weekday");
    const starts = form.getAll("start");
    const ends = form.getAll("end");
    const availability = weekdays.map((weekday, index) => ({
      weekday,
      start: starts[index],
      end: ends[index],
    }));
    const result = await saveDirectory(
      actor,
      kind,
      { ...Object.fromEntries(form), active: form.has("active"), availability },
      id ?? undefined,
    );
    nextId = result.id;
  } catch (error) {
    return { message: operationMessage(error) };
  }
  revalidatePath("/painel");
  revalidatePath(`/${kind}`);
  revalidatePath(`/${kind}/${nextId}`);
  redirect(`/${kind}/${nextId}?salvo=1`);
}

export async function persistAppointment(
  id: string | null,
  _: OperationState,
  form: FormData,
): Promise<OperationState> {
  let nextId: string;
  try {
    const actor = await currentActor();
    if (!actor)
      throw new OperationError("Faça login novamente para salvar.", 401);
    const data = Object.fromEntries(form);
    nextId = id
      ? (
          await updateAppointment(
            actor,
            recordId.parse(id),
            bookingUpdateSchema.parse(data),
          )
        ).id
      : (await createAppointment(actor, bookingCreateSchema.parse(data))).id;
  } catch (error) {
    return { message: operationMessage(error) };
  }
  revalidatePath("/painel");
  revalidatePath("/agenda");
  revalidatePath(`/agenda/${nextId}`);
  redirect(`/agenda/${nextId}?salvo=1`);
}

export async function persistAppointmentStatus(
  id: string,
  _: OperationState,
  form: FormData,
): Promise<OperationState> {
  try {
    const actor = await currentActor();
    if (!actor)
      throw new OperationError("Faça login novamente para salvar.", 401);
    const { revision, status } = bookingStatusSchema.parse(
      Object.fromEntries(form),
    );
    await changeAppointmentStatus(actor, recordId.parse(id), revision, status);
  } catch (error) {
    return { message: operationMessage(error) };
  }
  revalidatePath("/painel");
  revalidatePath("/agenda");
  revalidatePath(`/agenda/${id}`);
  redirect(`/agenda/${id}?salvo=1`);
}
