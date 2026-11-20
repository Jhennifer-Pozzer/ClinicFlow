export const periods = {
  month: "Este mês",
  "7": "Últimos 7 dias",
  "30": "Últimos 30 dias",
  "90": "Últimos 90 dias",
} as const;

export type Period = keyof typeof periods;

export function parsePeriod(value: unknown): Period {
  return value === "7" || value === "30" || value === "90" ? value : "month";
}

export function dashboardDates(period: Period, now: Date, timezone: string) {
  const day = new Date(
    new Intl.DateTimeFormat("sv-SE", { timeZone: timezone }).format(now),
  );
  const from = new Date(day);
  if (period === "month") from.setUTCDate(1);
  else from.setUTCDate(from.getUTCDate() - Number(period) + 1);

  const until = new Date(day);
  until.setUTCDate(until.getUTCDate() + 1);
  const key = (date: Date) => date.toISOString().slice(0, 10);
  const days: string[] = [];
  for (
    const date = new Date(from);
    date < until;
    date.setUTCDate(date.getUTCDate() + 1)
  ) {
    days.push(key(date));
  }
  return { from: key(from), today: key(day), until: key(until), days };
}
