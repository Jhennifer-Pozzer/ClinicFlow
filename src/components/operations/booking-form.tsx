"use client";

import { useActionState, useState } from "react";
import { appointmentStatus } from "@/components/dashboard/appointment-panels";
import {
  persistAppointment,
  persistAppointmentStatus,
  type OperationState,
} from "@/app/(workspace)/operations-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { brl } from "@/lib/format";
import type { AppointmentStatus } from "@/generated/prisma/enums";
import type { bookingOptions } from "@/server/operations/calendar";
import { Field, FormError, Select } from "./fields";

type Options = Awaited<ReturnType<typeof bookingOptions>>;
type Initial = {
  patientId: string;
  professionalId: string;
  serviceId: string;
  day: string;
  time: string;
};
type Booking = { id: string; revision: number };

export function BookingEditor({
  options,
  initial,
  booking,
  requestKey,
  timezone,
}: {
  options: Options;
  initial: Initial;
  booking?: Booking;
  requestKey?: string;
  timezone: string;
}) {
  const [state, dispatch, pending] = useActionState(
    persistAppointment.bind(null, booking?.id ?? null),
    {} satisfies OperationState,
  );
  const [value, setValue] = useState(initial);
  const [slots, setSlots] = useState(initial.time ? [initial.time] : []);
  const [lookup, setLookup] = useState<{
    pending: boolean;
    detail: string;
    error?: boolean;
  }>({ pending: false, detail: "" });
  const specialist = options.professionals.find(
    ({ id }) => id === value.professionalId,
  );
  const services = options.services.filter(
    (service) =>
      specialist?.specialtyId === service.specialtyId ||
      (value.serviceId === service.id &&
        value.professionalId === initial.professionalId),
  );
  const chosenService = services.find(({ id }) => id === value.serviceId);

  function change(values: Partial<Initial>) {
    const changed = { ...value, ...values, time: "" };
    if (values.professionalId !== undefined) {
      const specialtyId = options.professionals.find(
        ({ id }) => id === values.professionalId,
      )?.specialtyId;
      if (specialtyId !== chosenService?.specialtyId) changed.serviceId = "";
    }
    setValue(changed);
    setSlots([]);
    setLookup({ pending: false, detail: "" });
  }

  async function loadSlots() {
    setLookup({ pending: true, detail: "Consultando horários..." });
    const params = new URLSearchParams({
      day: value.day,
      professionalId: value.professionalId,
      serviceId: value.serviceId,
    });
    if (booking) params.set("appointmentId", booking.id);
    try {
      const response = await fetch(`/api/v1/agenda/horarios?${params}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as {
        slots?: string[];
        message?: string;
      };
      if (!response.ok || !data.slots)
        throw new Error(
          data.message || "Não foi possível consultar os horários.",
        );
      const unchanged =
        value.day === initial.day &&
        value.professionalId === initial.professionalId &&
        value.serviceId === initial.serviceId;
      const times = Array.from(
        new Set([
          ...data.slots,
          ...(unchanged && initial.time ? [initial.time] : []),
        ]),
      ).sort();
      setSlots(times);
      setValue({
        ...value,
        time: times.includes(value.time) ? value.time : "",
      });
      setLookup({
        pending: false,
        detail: data.slots.length
          ? `${data.slots.length} horários disponíveis.`
          : "Nenhum horário disponível para esta seleção.",
      });
    } catch (error) {
      setLookup({
        pending: false,
        detail:
          error instanceof Error
            ? error.message
            : "Não foi possível consultar os horários.",
        error: true,
      });
    }
  }

  return (
    <form action={dispatch} className="grid gap-5 p-5 sm:p-6">
      {booking ? (
        <input type="hidden" name="revision" value={booking.revision} />
      ) : (
        <input type="hidden" name="requestKey" value={requestKey} />
      )}
      {state.message && <FormError message={state.message} />}
      <fieldset
        disabled={lookup.pending || pending}
        className="grid gap-4 sm:grid-cols-2"
      >
        <Field id="booking-patient" label="Paciente" className="sm:col-span-2">
          <Select
            id="booking-patient"
            name="patientId"
            required
            value={value.patientId}
            onChange={(event) =>
              setValue({ ...value, patientId: event.target.value })
            }
          >
            <option value="">Selecione</option>
            {options.patients.map(({ id, name, internalCode }) => (
              <option key={id} value={id}>
                {name} · {internalCode}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="booking-professional" label="Profissional">
          <Select
            id="booking-professional"
            name="professionalId"
            required
            value={value.professionalId}
            onChange={(event) => change({ professionalId: event.target.value })}
          >
            <option value="">Selecione</option>
            {options.professionals.map(({ id, name }) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="booking-service" label="Serviço">
          <Select
            id="booking-service"
            name="serviceId"
            required
            value={value.serviceId}
            onChange={(event) => change({ serviceId: event.target.value })}
          >
            <option value="">
              {specialist ? "Selecione" : "Selecione um profissional primeiro"}
            </option>
            {services.map(({ id, name, durationMinutes }) => (
              <option key={id} value={id}>
                {name} · {durationMinutes} min
              </option>
            ))}
          </Select>
        </Field>
        <Field id="booking-day" label="Data">
          <Input
            id="booking-day"
            name="day"
            type="date"
            value={value.day}
            required
            onChange={(event) => change({ day: event.target.value })}
          />
        </Field>
        <Field id="booking-time" label="Horário">
          <Select
            id="booking-time"
            name="time"
            required
            value={value.time}
            onChange={(event) =>
              setValue({ ...value, time: event.target.value })
            }
          >
            <option value="">
              {slots.length ? "Selecione" : "Consulte a disponibilidade"}
            </option>
            {slots.map((time) => (
              <option key={time}>{time}</option>
            ))}
          </Select>
        </Field>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <Button
            type="button"
            variant="outline"
            disabled={!value.day || !value.professionalId || !value.serviceId}
            onClick={loadSlots}
          >
            Consultar horários
          </Button>
          <p
            role={lookup.error ? "alert" : "status"}
            className={`text-sm ${lookup.error ? "text-red-800" : "text-muted"}`}
          >
            {lookup.detail}
          </p>
        </div>
      </fieldset>
      <p className="text-xs text-muted">
        Horário da clínica · {timezone}
        {chosenService &&
          ` · Valor do serviço ${brl(chosenService.priceCents)}`}
      </p>
      <div>
        <Button
          type="submit"
          disabled={pending || lookup.pending || !value.time}
        >
          {pending ? "Salvando..." : "Salvar agendamento"}
        </Button>
      </div>
    </form>
  );
}

const verbs: Partial<Record<AppointmentStatus, string>> = {
  CONFIRMED: "Confirmar",
  CANCELLED: "Cancelar",
  COMPLETED: "Marcar comparecimento",
  NO_SHOW: "Marcar falta",
};

export function StatusEditor({
  booking,
  options,
}: {
  booking: Booking;
  options: AppointmentStatus[];
}) {
  const [state, dispatch, pending] = useActionState(
    persistAppointmentStatus.bind(null, booking.id),
    {} satisfies OperationState,
  );
  return (
    <form action={dispatch} className="grid gap-3 p-5 sm:p-6">
      {state.message && <FormError message={state.message} />}
      <input type="hidden" name="revision" value={booking.revision} />
      <Field id="booking-status" label="Ação">
        <Select id="booking-status" name="status" defaultValue="" required>
          <option value="">Selecione</option>
          {options.map((status) => (
            <option key={status} value={status}>
              {verbs[status] ?? appointmentStatus[status].label}
            </option>
          ))}
        </Select>
      </Field>
      <div>
        <Button type="submit" disabled={pending}>
          Atualizar situação
        </Button>
      </div>
    </form>
  );
}
