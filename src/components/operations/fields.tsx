import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Field({
  id,
  label,
  children,
  className,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm disabled:bg-slate-50",
        className,
      )}
      {...props}
    />
  );
}

export function FormError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800"
    >
      {message}
    </p>
  );
}
