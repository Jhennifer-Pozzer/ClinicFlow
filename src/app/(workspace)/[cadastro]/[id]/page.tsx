import Link from "next/link";
import { notFound } from "next/navigation";
import {
  OperationsHeading,
  OperationsWorkspace,
  Pagination,
  ResultMessage,
  pageRecord,
  workspaceActor,
} from "@/components/operations/workspace";
import { DirectoryEditor } from "@/components/operations/directory-form";
import { Panel, PanelHeading } from "@/components/ui/panel";
import { appointmentStatus } from "@/components/dashboard/appointment-panels";
import { buttonStyles } from "@/components/ui/button";
import { directory, isDirectoryKind } from "@/lib/operations";
import {
  directoryOptions,
  patientHistory,
  readDirectory,
  type DirectoryForm,
} from "@/server/operations/directory";
import { recordId } from "@/server/operations/schemas";

export default async function DirectoryRecordPage({
  params,
  searchParams,
}: PageProps<"/[cadastro]/[id]">) {
  const { cadastro: kind, id: segment } = await params;
  if (!isDirectoryKind(kind)) notFound();
  const id = segment === "novo" ? null : recordId.safeParse(segment).data;
  if (id === undefined) notFound();
  const recordType = directory[kind];
  const actor = await workspaceActor(recordType.permission);
  const query = await searchParams;
  const parsedPage =
    typeof query.historico === "string" ? Number(query.historico) : 1;
  const historyPage =
    Number.isInteger(parsedPage) && parsedPage > 0
      ? Math.min(1000, parsedPage)
      : 1;
  const initial: DirectoryForm = id
    ? await pageRecord(readDirectory(actor, kind, id))
    : { name: "", active: true, fields: {} };
  const [options, history] = await Promise.all([
    directoryOptions(actor, kind, initial.fields.userId ?? ""),
    kind === "pacientes" && id ? patientHistory(actor, id, historyPage) : null,
  ]);
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: actor.organization.timezone,
  });

  return (
    <OperationsWorkspace actor={actor} active={kind}>
      <OperationsHeading
        title={id ? initial.name : `Cadastrar ${recordType.singular}`}
        description={
          initial.fields.createdAt
            ? `Cadastro realizado em ${formatter.format(new Date(initial.fields.createdAt))}`
            : recordType.description
        }
      >
        <div className="flex flex-wrap gap-2">
          {id && kind === "profissionais" && (
            <Link
              className={buttonStyles()}
              href={`/agenda?profissional=${id}`}
            >
              Ver agenda individual
            </Link>
          )}
          <Link
            href={`/${kind}`}
            className={buttonStyles({ variant: "outline" })}
          >
            Voltar para {recordType.title.toLowerCase()}
          </Link>
        </div>
      </OperationsHeading>
      {query.salvo === "1" && (
        <ResultMessage text="Cadastro salvo com sucesso." />
      )}
      <div
        className={
          history
            ? "grid items-start gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]"
            : "max-w-4xl"
        }
      >
        <Panel>
          <PanelHeading title="Dados do cadastro" />
          <DirectoryEditor
            key={id ?? kind}
            id={id}
            kind={kind}
            initial={initial}
            options={options}
          />
        </Panel>
        {history && id && (
          <Panel>
            <PanelHeading
              title="Histórico de agendamentos"
              description="Atendimentos administrativos deste paciente."
            />
            {history.rows.length ? (
              <ul className="mt-3 divide-y divide-border">
                {history.rows.map(
                  ({
                    id: appointmentId,
                    startsAt,
                    status,
                    service,
                    professional,
                  }) => (
                    <li key={appointmentId} className="px-5 py-3 sm:px-6">
                      <Link
                        className="font-semibold hover:text-primary hover:underline"
                        href={`/agenda/${appointmentId}`}
                      >
                        {service.name}
                      </Link>
                      <p className="mt-1 text-sm text-muted">
                        {formatter.format(startsAt)} · {professional.name}
                      </p>
                      <span
                        className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${appointmentStatus[status].badge}`}
                      >
                        {appointmentStatus[status].label}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            ) : (
              <p className="p-5 text-sm text-muted">
                Nenhum agendamento neste histórico.
              </p>
            )}
            <Pagination
              page={historyPage}
              pageSize={history.pageSize}
              count={history.count}
              href={(page) => `/pacientes/${id}?historico=${page}`}
            />
          </Panel>
        )}
      </div>
    </OperationsWorkspace>
  );
}
