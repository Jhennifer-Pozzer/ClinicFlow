import Link from "next/link";
import Form from "next/form";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { appointmentStatus } from "@/components/dashboard/appointment-panels";
import { Button, buttonStyles } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Input } from "@/components/ui/input";
import {
  localDay,
  localTime,
  shiftDay,
  type CalendarView,
} from "@/lib/calendar";
import type {
  calendarFilters,
  calendarOptions,
  readCalendar,
} from "@/server/operations/calendar";
import { Field, Select } from "./fields";

type Filters = ReturnType<typeof calendarFilters>;
type Options = Awaited<ReturnType<typeof calendarOptions>>;
type Calendar = Awaited<ReturnType<typeof readCalendar>>;
type Entry = Calendar["appointments"][number];
const views = { dia: "Dia", semana: "Semana", mes: "Mês" } as const;

function url(filters: Filters, day = filters.day, view = filters.view) {
  const params = new URLSearchParams({ visao: view, data: day });
  if (filters.professionalId)
    params.set("profissional", filters.professionalId);
  if (filters.specialtyId) params.set("especialidade", filters.specialtyId);
  return `/agenda?${params}`;
}

export function CalendarControls({
  filters,
  options,
  period,
  canManage,
}: {
  filters: Filters;
  options: Options;
  period: Calendar["period"];
  canManage: boolean;
}) {
  const dateLabel =
    filters.view === "mes"
      ? new Intl.DateTimeFormat("pt-BR", {
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        }).format(new Date(filters.day))
      : filters.view === "dia"
        ? new Intl.DateTimeFormat("pt-BR", {
            dateStyle: "full",
            timeZone: "UTC",
          }).format(new Date(filters.day))
        : `${shortDate(period.from)} a ${shortDate(shiftDay(period.until, -1))}`;
  const createParams = new URLSearchParams({ data: filters.day });
  if (filters.professionalId)
    createParams.set("profissional", filters.professionalId);

  return (
    <Panel className="mb-5 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            aria-label="Período anterior"
            href={url(filters, period.previous)}
            className={buttonStyles({
              variant: "outline",
              className: "px-2.5",
            })}
          >
            <ChevronLeft size={17} aria-hidden="true" />
          </Link>
          <Link
            aria-label="Próximo período"
            href={url(filters, period.next)}
            className={buttonStyles({
              variant: "outline",
              className: "px-2.5",
            })}
          >
            <ChevronRight size={17} aria-hidden="true" />
          </Link>
          <Link
            href={url(filters, filters.today)}
            className={buttonStyles({ variant: "outline" })}
          >
            Hoje
          </Link>
          <h2 className="text-lg font-semibold capitalize">{dateLabel}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <nav
            aria-label="Visualização da agenda"
            className="inline-flex gap-1 rounded-lg border border-border bg-surface p-1"
          >
            {(Object.keys(views) as CalendarView[]).map((view) => (
              <Link
                key={view}
                href={url(filters, filters.day, view)}
                aria-current={view === filters.view ? "page" : undefined}
                className={buttonStyles({
                  variant: view === filters.view ? "primary" : "ghost",
                  className: "min-h-9 px-3",
                })}
              >
                {views[view]}
              </Link>
            ))}
          </nav>
          {canManage && (
            <Link
              href={`/agenda/novo?${createParams}`}
              className={buttonStyles()}
            >
              <Plus size={17} aria-hidden="true" />
              Novo agendamento
            </Link>
          )}
        </div>
      </div>
      <Form
        action="/agenda"
        className="mt-4 grid items-end gap-3 sm:flex sm:flex-wrap"
      >
        <input type="hidden" name="visao" value={filters.view} />
        <Field id="calendar-date" label="Data">
          <Input
            id="calendar-date"
            type="date"
            name="data"
            defaultValue={filters.day}
          />
        </Field>
        {canManage && (
          <>
            <Field id="calendar-specialty" label="Especialidade">
              <Select
                id="calendar-specialty"
                name="especialidade"
                defaultValue={filters.specialtyId ?? ""}
              >
                <option value="">Todas</option>
                {options.specialties.map(({ id, name }) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="calendar-professional" label="Profissional">
              <Select
                id="calendar-professional"
                name="profissional"
                defaultValue={filters.professionalId ?? ""}
              >
                <option value="">Todos</option>
                {options.professionals.map(({ id, name }) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </Select>
            </Field>
          </>
        )}
        <Button variant="outline" type="submit">
          Aplicar filtros
        </Button>
      </Form>
    </Panel>
  );
}

const shortDate = (day: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(day));
const shortWeekday = (day: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    timeZone: "UTC",
  }).format(new Date(day));
const weekdayNames = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function AppointmentCard({ row, timezone }: { row: Entry; timezone: string }) {
  const status = appointmentStatus[row.status];
  return (
    <Link
      href={`/agenda/${row.id}`}
      className="block rounded-lg border border-border bg-white p-3 text-sm hover:border-blue-300 hover:bg-blue-50"
    >
      <span className="block font-semibold tabular-nums text-blue-800">
        {localTime(row.startsAt, timezone)}
      </span>
      <strong className="mt-1 block wrap-anywhere">{row.patient.name}</strong>
      <span className="mt-1 block wrap-anywhere text-xs text-muted">
        {row.service.name} · {row.professional.name}
      </span>
      <span
        className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${status.badge}`}
      >
        {status.label}
      </span>
    </Link>
  );
}

export function CalendarBoard({
  calendar,
  filters,
  timezone,
}: {
  calendar: Calendar;
  filters: Filters;
  timezone: string;
}) {
  const groups = new Map<string, Entry[]>();
  for (const row of calendar.appointments) {
    const day = localDay(row.startsAt, timezone);
    const group = groups.get(day);
    if (group) group.push(row);
    else groups.set(day, [row]);
  }
  const days = Array.from(
    { length: filters.view === "mes" ? 42 : filters.view === "semana" ? 7 : 1 },
    (_, index) => shiftDay(calendar.period.from, index),
  );
  if (filters.view === "mes") {
    return (
      <Panel className="overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border bg-surface text-center text-xs font-semibold text-muted">
          {weekdayNames.map((day) => (
            <span className="py-2" key={day}>
              {day}
            </span>
          ))}
        </div>
        <div
          className="grid grid-cols-7 gap-px bg-border"
          aria-label="Calendário mensal"
        >
          {days.map((day) => {
            const rows = groups.get(day) ?? [];
            return (
              <div
                key={day}
                className={`min-h-15 min-w-0 p-1 sm:min-h-24 sm:p-2 ${day.slice(0, 7) === filters.day.slice(0, 7) ? "bg-white" : "bg-slate-50"}`}
              >
                <Link
                  href={url(filters, day, "dia")}
                  aria-label={`${shortDate(day)}, ${rows.length} atendimentos`}
                  className="group block min-h-9 rounded-md text-center hover:bg-blue-50 sm:text-left"
                >
                  <span
                    className={`inline-grid size-6 place-items-center rounded-full text-xs font-semibold ${day === filters.today ? "bg-primary text-white" : "text-muted"}`}
                  >
                    {Number(day.slice(-2))}
                  </span>
                  {rows.length > 0 && (
                    <span className="block text-xs font-semibold text-blue-800 sm:px-1">
                      {rows.length}
                      <span className="hidden sm:inline"> atend.</span>
                    </span>
                  )}
                </Link>
                {rows.slice(0, 2).map((row) => (
                  <Link
                    key={row.id}
                    href={`/agenda/${row.id}`}
                    className="mt-1 hidden truncate rounded bg-blue-50 px-1.5 py-1 text-xs font-medium text-blue-900 hover:bg-blue-100 xl:block"
                  >
                    {localTime(row.startsAt, timezone)} {row.patient.name}
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
      </Panel>
    );
  }

  return (
    <div
      className={
        filters.view === "semana"
          ? "grid items-start gap-2 sm:grid-cols-2 2xl:grid-cols-7"
          : "grid gap-4"
      }
      aria-label="Horários da agenda"
    >
      {days.map((day) => {
        const rows = groups.get(day) ?? [];
        return (
          <Panel key={day} className="min-w-0 p-3 sm:p-4">
            <h3
              className={`mb-3 font-semibold capitalize ${day === filters.today ? "text-primary" : ""}`}
            >
              {filters.view === "semana" ? (
                <Link
                  href={url(filters, day, "dia")}
                  className="hover:underline"
                >
                  {shortWeekday(day)} · {shortDate(day)}
                </Link>
              ) : (
                shortDate(day)
              )}
            </h3>
            {rows.length ? (
              <div
                className={
                  filters.view === "dia"
                    ? "grid gap-2 sm:grid-cols-2 xl:grid-cols-3"
                    : "grid gap-2"
                }
              >
                {rows.map((row) => (
                  <AppointmentCard key={row.id} row={row} timezone={timezone} />
                ))}
              </div>
            ) : (
              <p className="rounded-lg bg-surface px-3 py-4 text-sm text-muted">
                Sem atendimentos.
              </p>
            )}
          </Panel>
        );
      })}
    </div>
  );
}
