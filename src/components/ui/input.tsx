import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm",
        className,
      )}
      {...props}
    />
  );
}
