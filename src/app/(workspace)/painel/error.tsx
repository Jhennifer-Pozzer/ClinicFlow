"use client";

import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";

export default function DashboardError() {
  return (
    <main className="grid min-h-dvh place-items-center p-5">
      <section className="w-full max-w-md rounded-2xl border border-border bg-white p-7 shadow-panel">
        <h1 className="text-xl font-bold tracking-tight">
          Não foi possível carregar o painel
        </h1>
        <p className="mt-2 mb-5 text-sm text-muted">
          Tente abrir o painel novamente.
        </p>
        <Link href="/painel" className={buttonStyles()}>
          Voltar ao painel
        </Link>
      </section>
    </main>
  );
}
