import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Panel({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-2xl border border-border bg-white shadow-panel",
        className,
      )}
      {...props}
    />
  );
}

export function PanelHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className="px-5 pt-5 sm:px-6">
      <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
    </header>
  );
}
