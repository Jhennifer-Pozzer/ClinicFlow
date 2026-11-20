import type { Permission } from "@/server/auth/permissions";

export const directory = {
  pacientes: {
    title: "Pacientes",
    singular: "paciente",
    permission: "patients:manage",
    description:
      "Gerencie os cadastros administrativos e consulte o histórico de atendimentos.",
  },
  profissionais: {
    title: "Profissionais",
    singular: "profissional",
    permission: "catalog:manage",
    description:
      "Organize a equipe, as especialidades e os horários de atendimento.",
  },
  especialidades: {
    title: "Especialidades",
    singular: "especialidade",
    permission: "catalog:manage",
    description: "Organize as áreas de atendimento da clínica.",
  },
  servicos: {
    title: "Serviços",
    singular: "serviço",
    permission: "catalog:manage",
    description:
      "Gerencie os serviços, a duração e os valores de cada atendimento.",
  },
} as const satisfies Record<
  string,
  {
    title: string;
    singular: string;
    permission: Permission;
    description: string;
  }
>;

export type DirectoryKind = keyof typeof directory;

export function isDirectoryKind(value: string): value is DirectoryKind {
  return Object.hasOwn(directory, value);
}

export const weekdays = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

export function minuteLabel(minute: number) {
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}
