import {
  CalendarDays,
  LayoutDashboard,
  Wallet,
  UsersRound,
} from "lucide-react";

const examples = [
  {
    label: "Na agenda hoje",
    value: "12",
    icon: CalendarDays,
    color: "bg-blue-50 text-primary",
  },
  {
    label: "Pacientes cadastrados",
    value: "40",
    icon: UsersRound,
    color: "bg-violet-50 text-violet-700",
  },
  {
    label: "Receita recebida",
    value: "R$ 8.450",
    icon: Wallet,
    color: "bg-teal-50 text-teal-700",
  },
];

export function DashboardPreview() {
  return (
    <figure className="min-w-0 overflow-hidden rounded-2xl border border-white/20 bg-surface text-ink shadow-2xl">
      <figcaption className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-border bg-white px-4 py-3 text-sm sm:px-5">
        <span className="inline-flex items-center gap-2 font-semibold">
          <LayoutDashboard
            size={16}
            className="text-primary"
            aria-hidden="true"
          />{" "}
          Visão geral
        </span>
        <span className="text-xs font-medium text-muted">
          Prévia com valores ilustrativos
        </span>
      </figcaption>
      <div className="flex">
        <div
          className="hidden w-33 shrink-0 border-r border-border bg-white p-3.5 sm:block"
          aria-hidden="true"
        >
          <div className="mb-5 text-sm font-bold">ClinicFlow</div>
          {["Visão geral", "Indicadores", "Agenda", "Financeiro"].map(
            (item, index) => (
              <div
                key={item}
                className={
                  index === 0
                    ? "mb-2 rounded-md bg-blue-50 px-2 py-1.5 text-xs font-semibold text-blue-800"
                    : "mb-2 px-2 py-1.5 text-xs text-muted"
                }
              >
                {item}
              </div>
            ),
          )}
        </div>
        <div className="w-full min-w-0 p-3.5 sm:p-5">
          <p className="text-lg font-bold tracking-tight sm:text-xl">
            Clínica Vida Plena
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {examples.map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 sm:block sm:p-3"
              >
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-lg ${color}`}
                >
                  <Icon size={15} aria-hidden="true" />
                </span>
                <p className="text-xs text-muted sm:mt-2">{label}</p>
                <p className="ml-auto whitespace-nowrap text-sm font-bold sm:mt-1 sm:text-base">
                  {value}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl border border-border bg-white p-3 sm:p-4">
            <p className="text-sm font-semibold">Evolução dos agendamentos</p>
            <div
              className="mt-4 flex h-16 items-end gap-2 border-b border-border sm:h-22"
              aria-hidden="true"
            >
              {[35, 58, 45, 71, 53, 79, 68, 89, 74, 96, 84, 92].map(
                (height, index) => (
                  <div
                    key={index}
                    style={{ height: `${height}%` }}
                    className="flex-1 rounded-t-sm bg-linear-to-t from-blue-300 to-primary"
                  />
                ),
              )}
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted">
              <span>Início do período</span>
              <span>Hoje</span>
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}
