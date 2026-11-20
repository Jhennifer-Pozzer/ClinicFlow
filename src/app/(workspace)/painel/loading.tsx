export default function LoadingDashboard() {
  return (
    <div
      role="status"
      className="min-h-dvh bg-[#f5f7fb] px-4 pt-10 lg:ml-56 lg:px-9"
    >
      <span className="sr-only">Carregando painel</span>
      <div aria-hidden="true" className="grid gap-5 motion-safe:animate-pulse">
        <div className="h-10 max-w-sm rounded-xl bg-slate-200" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="h-32 rounded-2xl border border-border bg-white"
            />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
          <div className="h-64 rounded-2xl border border-border bg-white" />
          <div className="h-64 rounded-2xl border border-border bg-white" />
        </div>
      </div>
    </div>
  );
}
