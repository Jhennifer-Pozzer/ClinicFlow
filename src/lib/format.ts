const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const integer = new Intl.NumberFormat("pt-BR");

export function brl(cents: number) {
  return currency.format(cents / 100);
}

export function numberLabel(value: number) {
  return integer.format(value);
}

export function shortDate(day: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(new Date(day));
}

export function monthLabel(month: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${month}-01`));
}

export function initials(name: string) {
  const words = name.trim().split(/\s+/);
  return (
    words[0][0] + (words.length > 1 ? (words.at(-1)?.[0] ?? "") : "")
  ).toUpperCase();
}
