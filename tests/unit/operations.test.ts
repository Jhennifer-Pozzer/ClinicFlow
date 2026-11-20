import { describe, expect, it } from "vitest";
import { calendarPeriod } from "../../src/lib/calendar";
import { allowedStatuses } from "../../src/server/operations/appointments";
import { fitsWindow } from "../../src/server/operations/slots";
import {
  availabilitySchema,
  directorySchemas,
} from "../../src/server/operations/schemas";

describe("regras de operações", () => {
  it("cobre toda a duração em faixas contíguas sem ultrapassar intervalos", () => {
    const ranges = [
      { startMinute: 480, endMinute: 600 },
      { startMinute: 600, endMinute: 720 },
      { startMinute: 780, endMinute: 1020 },
    ];
    expect(fitsWindow(570, 630, ranges)).toBe(true);
    expect(fitsWindow(690, 790, ranges)).toBe(false);
  });
  it("aceita faixas contíguas e rejeita sobreposição", () => {
    const first = { weekday: 1, start: "08:00", end: "12:00" };
    expect(
      availabilitySchema.safeParse([
        first,
        { weekday: 1, start: "12:00", end: "17:00" },
      ]).success,
    ).toBe(true);
    expect(
      availabilitySchema.safeParse([
        first,
        { weekday: 1, start: "11:00", end: "17:00" },
      ]).success,
    ).toBe(false);
  });

  it("interpreta o valor BRL em centavos e rejeita precisão extra", () => {
    const input = {
      name: "Serviço teste",
      description: "Teste",
      durationMinutes: "25",
      specialtyId: "15d12819-9458-48f5-8469-66c6a1b11ce8",
      price: "150,20",
    };
    expect(directorySchemas.servicos.parse(input).price).toBe(15020);
    expect(
      directorySchemas.servicos.safeParse({ ...input, price: "150,205" })
        .success,
    ).toBe(false);
  });

  it("usa segunda-feira como início de semana", () => {
    expect(calendarPeriod("2026-11-22", "semana")).toEqual({
      from: "2026-11-16",
      until: "2026-11-23",
      previous: "2026-11-09",
      next: "2026-11-23",
    });
  });

  it("habilita comparecimento e falta após o horário e encerra a transição no cancelamento", () => {
    const start = new Date("2026-11-20T12:00:00Z");
    expect(
      allowedStatuses("SCHEDULED", start, new Date(start.getTime() - 1)),
    ).toEqual(["CONFIRMED", "CANCELLED"]);
    expect(allowedStatuses("CONFIRMED", start, start)).toEqual([
      "CANCELLED",
      "COMPLETED",
      "NO_SHOW",
    ]);
    expect(allowedStatuses("CANCELLED", start, start)).toEqual([]);
  });
});
