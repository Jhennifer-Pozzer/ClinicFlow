import Link from "next/link";
import Form from "next/form";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import {
  OperationsHeading,
  OperationsWorkspace,
  Pagination,
} from "@/components/operations/workspace";
import { Field, Select } from "@/components/operations/fields";
import { Button, buttonStyles } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { directory, isDirectoryKind } from "@/lib/operations";
import {
  listDirectory,
  readDirectoryFilters,
} from "@/server/operations/directory";
import { workspaceActor } from "@/components/operations/workspace";

export default async function DirectoryPage({
  params,
  searchParams,
}: PageProps<"/[cadastro]">) {
  const { cadastro: kind } = await params;
  if (!isDirectoryKind(kind)) notFound();
  const recordType = directory[kind];
  const actor = await workspaceActor(recordType.permission);
  const filters = readDirectoryFilters(await searchParams);
  const { rows, count, pageSize } = await listDirectory(actor, kind, filters);
  const path = `/${kind}`;

  return (
    <OperationsWorkspace actor={actor} active={kind}>
      <OperationsHeading
        title={recordType.title}
        description={recordType.description}
      >
        <Link href={`${path}/novo`} className={buttonStyles()}>
          <Plus size={17} aria-hidden="true" /> Novo cadastro
        </Link>
      </OperationsHeading>
      <Panel>
        <Form
          action={path}
          className="grid items-end gap-3 border-b border-border p-5 sm:grid-cols-[minmax(0,1fr)_12rem_auto]"
        >
          <Field id="directory-query" label="Buscar por nome">
            <Input
              id="directory-query"
              name="q"
              defaultValue={filters.q}
              maxLength={80}
              placeholder="Digite um nome"
            />
          </Field>
          <Field id="directory-status" label="Situação">
            <Select
              id="directory-status"
              name="status"
              defaultValue={filters.status}
            >
              <option value="active">Ativos</option>
              <option value="inactive">
                {kind === "pacientes" ? "Arquivados" : "Inativos"}
              </option>
              <option value="all">Todos</option>
            </Select>
          </Field>
          <Button type="submit" variant="outline">
            Filtrar
          </Button>
        </Form>
        {rows.length ? (
          <ul className="divide-y divide-border">
            {rows.map(({ id, name, detail, extra, active }) => (
              <li
                key={id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
              >
                <div className="min-w-0">
                  <Link
                    className="font-semibold wrap-anywhere hover:text-primary hover:underline"
                    href={`${path}/${id}`}
                  >
                    {name}
                  </Link>
                  {detail && (
                    <p className="mt-1 text-sm wrap-anywhere text-muted">
                      {detail}
                    </p>
                  )}
                  {extra && (
                    <p className="mt-1 text-sm wrap-anywhere text-muted sm:hidden">
                      {extra}
                    </p>
                  )}
                </div>
                <span className="hidden text-sm wrap-anywhere text-muted sm:block">
                  {extra}
                </span>
                <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${active ? "bg-teal-50 text-teal-900" : "bg-slate-100 text-slate-700"}`}
                  >
                    {active
                      ? "Ativo"
                      : kind === "pacientes"
                        ? "Arquivado"
                        : "Inativo"}
                  </span>
                  <Link
                    href={`${path}/${id}`}
                    className={buttonStyles({
                      variant: "ghost",
                      className: "min-h-9 px-2 text-blue-800",
                    })}
                    aria-label={`Editar ${name}`}
                  >
                    Editar
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-7 text-sm text-muted">
            Nenhum cadastro corresponde aos filtros.
          </p>
        )}
        <Pagination
          page={filters.page}
          pageSize={pageSize}
          count={count}
          href={(page) =>
            `${path}?${new URLSearchParams({ q: filters.q, status: filters.status, pagina: String(page) })}`
          }
        />
      </Panel>
    </OperationsWorkspace>
  );
}
