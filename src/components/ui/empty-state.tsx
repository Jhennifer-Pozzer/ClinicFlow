import { CalendarDays } from "lucide-react";

export function EmptyState({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <div className="grid justify-items-center gap-2 px-5 py-9 text-center">
      <div className="mb-1 grid size-10 place-items-center rounded-xl bg-blue-50 text-primary">
        <CalendarDays size={19} aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="max-w-xs text-sm text-muted">{detail}</p>
    </div>
  );
}
