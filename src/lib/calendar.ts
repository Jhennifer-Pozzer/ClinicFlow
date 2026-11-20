export type CalendarView = "dia" | "semana" | "mes";

export function localDay(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: timezone }).format(date);
}

export function localTime(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

export function shiftDay(day: string, offset: number) {
  const date = new Date(day);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

export function calendarPeriod(day: string, view: CalendarView) {
  const date = new Date(day);
  const weekday = (date.getUTCDay() + 6) % 7;
  if (view === "dia")
    return {
      from: day,
      until: shiftDay(day, 1),
      previous: shiftDay(day, -1),
      next: shiftDay(day, 1),
    };
  if (view === "semana") {
    const from = shiftDay(day, -weekday);
    return {
      from,
      until: shiftDay(from, 7),
      previous: shiftDay(from, -7),
      next: shiftDay(from, 7),
    };
  }
  const month = (offset: number) =>
    new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offset, 1))
      .toISOString()
      .slice(0, 10);
  const first = month(0);
  const from = shiftDay(first, -(new Date(first).getUTCDay() + 6) % 7);
  return {
    from,
    until: shiftDay(from, 42),
    previous: month(-1),
    next: month(1),
  };
}
