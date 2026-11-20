import { describe, expect, it } from "vitest";
import { dashboardDates, parsePeriod } from "../../src/server/dashboard/period";

describe("período do painel", () => {
  it("respeita a data local quando já virou o dia em UTC", () => {
    const dates = dashboardDates(
      "7",
      new Date("2026-12-01T01:00:00Z"),
      "America/Sao_Paulo",
    );
    expect(dates).toMatchObject({
      from: "2026-11-24",
      today: "2026-11-30",
      until: "2026-12-01",
    });
    expect(dates.days).toHaveLength(7);
    expect(dates.days.at(-1)).toBe(dates.today);
  });

  it("começa o mês no primeiro dia do calendário da clínica", () => {
    const dates = dashboardDates(
      "month",
      new Date("2026-11-01T03:00:00Z"),
      "America/Sao_Paulo",
    );
    expect(dates).toEqual({
      from: "2026-11-01",
      today: "2026-11-01",
      until: "2026-11-02",
      days: ["2026-11-01"],
    });
  });

  it("limita o período às opções exibidas", () => {
    expect(parsePeriod(["90", "7"])).toBe("month");
    expect(parsePeriod("365")).toBe("month");
    expect(parsePeriod("90")).toBe("90");
  });
});
