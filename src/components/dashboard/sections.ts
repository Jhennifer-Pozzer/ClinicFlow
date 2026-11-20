import { directory, type DirectoryKind } from "@/lib/operations";
import { can } from "@/server/auth/permissions";
import type { Role } from "@/generated/prisma/enums";

export type DashboardSection = {
  id: string;
  label: string;
  keywords: string;
  href?: string;
};

export function dashboardSections(showFinance: boolean) {
  const entries: DashboardSection[] = [
    {
      id: "visao-geral",
      label: "Visão geral",
      keywords: "início painel dashboard",
    },
    {
      id: "indicadores",
      label: "Indicadores",
      keywords: "gráficos status especialidades consultas pacientes",
    },
    {
      id: "agenda-do-dia",
      label: "Agenda do dia",
      keywords: "horários consulta atendimentos",
    },
    {
      id: "proximos-atendimentos",
      label: "Próximos atendimentos",
      keywords: "agenda consulta próximos",
    },
  ];
  if (showFinance)
    entries.push({
      id: "financeiro",
      label: "Financeiro",
      keywords: "receita recebidos pendentes valores",
    });
  return entries;
}

export function workspaceSections(
  role: Role,
  active = "visao-geral",
): DashboardSection[] {
  const [overview, ...dashboard] = dashboardSections(
    can(role, "finance:manage"),
  ).map((section) => ({
    ...section,
    href:
      active === "visao-geral"
        ? undefined
        : section.id === "visao-geral"
          ? "/painel"
          : `/painel#${section.id}`,
  }));
  const records = (Object.keys(directory) as DirectoryKind[])
    .filter((id) => can(role, directory[id].permission))
    .map((id) => ({
      id,
      label: directory[id].title,
      keywords: `cadastros ${directory[id].singular}`,
      href: `/${id}`,
    }));
  return [
    overview,
    {
      id: "agenda",
      label: "Agenda",
      keywords: "calendário agendamentos",
      href: "/agenda",
    },
    ...records,
    ...dashboard,
  ];
}

export type DashboardAlert = { title: string; detail: string; section: string };
