import { Brand } from "./brand";
import { cn } from "@/lib/utils";

export function AuthCard({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <main
      className={cn("grid min-h-dvh place-items-center px-4 py-10", className)}
    >
      <section
        aria-labelledby="titulo"
        className="w-full max-w-md rounded-3xl border border-border bg-white p-6 shadow-sm sm:p-9"
      >
        <Brand />
        <h1 id="titulo" className="mt-9 text-2xl font-bold tracking-tight">
          {title}
        </h1>
        <p className="mt-2 mb-6 text-sm leading-6 text-muted">{description}</p>
        {children}
      </section>
    </main>
  );
}
