import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const styles = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-center text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-blue-700",
        outline:
          "border border-border bg-white text-ink hover:border-blue-200 hover:bg-blue-50",
        ghost: "text-ink hover:bg-slate-100",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

type StyleProps = VariantProps<typeof styles>;

export function buttonStyles({
  variant,
  className,
}: StyleProps & { className?: string } = {}) {
  return cn(styles({ variant }), className);
}

export function Button({
  className,
  variant,
  ...props
}: ComponentProps<"button"> & StyleProps) {
  return <button className={buttonStyles({ variant, className })} {...props} />;
}
