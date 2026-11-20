import { CalendarDays, ChartNoAxesCombined, ShieldCheck } from "lucide-react";

export const features = [
  {
    title: "Agenda e cadastros",
    description:
      "Cadastre pacientes, consulte horários disponíveis e organize as consultas e confirmações.",
    icon: CalendarDays,
    color: "bg-blue-50 text-primary",
  },
  {
    title: "Indicadores por período",
    description:
      "Acompanhe consultas, cancelamentos e receitas com filtros e gráficos para o período que você escolher.",
    icon: ChartNoAxesCombined,
    color: "bg-teal-50 text-teal-700",
  },
  {
    title: "Acesso para cada perfil",
    description:
      "A recepção vê a agenda da clínica, profissionais veem seus atendimentos e a administração acompanha os dados financeiros.",
    icon: ShieldCheck,
    color: "bg-violet-50 text-violet-700",
  },
] as const;

export const steps = [
  {
    title: "Entre na clínica demonstrativa",
    description:
      "Comece pela Clínica Vida Plena, com uma agenda e transações fictícias já cadastradas.",
  },
  {
    title: "Escolha o período",
    description:
      "Consulte este mês ou os últimos 7, 30 ou 90 dias para acompanhar a atividade da clínica.",
  },
  {
    title: "Confira a agenda",
    description:
      "Veja o dia, os próximos atendimentos e as consultas que aguardam confirmação.",
  },
];

export const faqs = [
  {
    question: "Preciso criar uma conta para experimentar?",
    answer:
      "O acesso direto à Clínica Vida Plena usa uma conta demonstrativa quando habilitado nesta instalação. Também é possível entrar com um dos perfis de teste configurados.",
  },
  {
    question: "O que posso ver na demonstração?",
    answer:
      "A demonstração inclui o painel de indicadores e permite experimentar os cadastros e agendamentos com dados fictícios.",
  },
  {
    question: "O painel usa dados reais de pacientes?",
    answer:
      "A Clínica Vida Plena contém apenas dados sintéticos. O ClinicFlow foi desenvolvido como projeto de portfólio para rotinas administrativas.",
  },
  {
    question: "Quais recursos serão adicionados nas próximas fases?",
    answer:
      "Gestão financeira, relatórios administrativos, configurações e auditoria estão previstos para a próxima fase.",
  },
];
