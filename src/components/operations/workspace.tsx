import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { signOut } from "@/auth";
import { workspaceSections } from "@/components/dashboard/sections";
import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import { authorize } from "@/server/auth/access";
import { roleLabels, type Permission } from "@/server/auth/permissions";
import { OperationError, type Actor } from "@/server/operations/core";

export async function workspaceActor(
  permission: Permission = "workspace:read",
) {
  const result = await authorize(permission);
  if (result.status === 401) redirect("/entrar");
  if (result.status !== 200) notFound();
  return result.actor;
}

export async function pageRecord<T>(read: Promise<T>) {
  try {
    return await read;
  } catch (error) {
    if (error instanceof OperationError && error.status === 404) notFound();
    throw error;
  }
}

export function OperationsWorkspace({
  actor,
  active,
  children,
}: {
  actor: Actor;
  active: string;
  children: React.ReactNode;
}) {
  return (
    <WorkspaceShell
      active={active}
      sections={workspaceSections(actor.role, active)}
      profile={{
        name: actor.name,
        email: actor.email,
        role: roleLabels[actor.role],
      }}
      logout={async () => {
        "use server";
        await signOut({ redirectTo: "/entrar" });
      }}
    >
      {children}
    </WorkspaceShell>
  );
}

export function OperationsHeading({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {description}
          </p>
        )}
      </div>
      {children}
    </header>
  );
}

export function ResultMessage({ text }: { text: string }) {
  return (
    <p
      role="status"
      className="mb-5 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-900"
    >
      {text}
    </p>
  );
}

export function Pagination({
  page,
  pageSize,
  count,
  href,
}: {
  page: number;
  pageSize: number;
  count: number;
  href: (page: number) => string;
}) {
  const last = Math.max(1, Math.ceil(count / pageSize));
  if (page === 1 && last === 1) return null;
  const style =
    "rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50";
  return (
    <nav
      aria-label="Paginação"
      className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
    >
      <p className="text-sm text-muted">
        Página {page} de {last} · {count} registros
      </p>
      <div className="flex flex-wrap gap-2">
        {page > 1 && (
          <Link href={href(Math.min(last, page - 1))} className={style}>
            Anterior
          </Link>
        )}
        {page < last && (
          <Link href={href(page + 1)} className={style}>
            Próxima
          </Link>
        )}
      </div>
    </nav>
  );
}
