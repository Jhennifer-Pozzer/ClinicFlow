import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { AuthCard } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/landing/site-header";
import { enterDemo } from "../auth-actions";

export const metadata = { title: "Demonstração" };

export default async function DemoPage({
  searchParams,
}: PageProps<"/demonstracao">) {
  const params = await searchParams;
  const available = process.env.DEMO_ACCESS_ENABLED === "true";

  return (
    <>
      <SiteHeader />
      <AuthCard
        className="min-h-[calc(100dvh-8rem)] lg:min-h-[calc(100dvh-4.5rem)]"
        title="Explore a Clínica Vida Plena"
        description="Acesse o painel com um perfil demonstrativo e explore agendamentos, indicadores e receitas fictícias."
      >
        <p className="mb-5 flex items-start gap-2 rounded-xl bg-teal-50 p-3 text-sm leading-6 text-teal-900">
          <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          Ambiente de portfólio com dados sintéticos.
        </p>
        {params.status === "indisponivel" && (
          <p role="alert" className="mb-4 text-sm text-red-800">
            A demonstração está indisponível no momento. Tente novamente mais
            tarde.
          </p>
        )}
        {available ? (
          <form action={enterDemo}>
            <Button className="w-full" type="submit">
              Acessar painel demonstrativo
            </Button>
          </form>
        ) : (
          <p className="mb-4 rounded-xl border border-border bg-surface p-3 text-sm text-muted">
            O acesso direto à demonstração está desativado nesta instalação.
          </p>
        )}
        <Link
          href="/entrar"
          className="mt-5 inline-block text-sm font-semibold text-blue-700 hover:underline"
        >
          Entrar com e-mail e senha
        </Link>
      </AuthCard>
    </>
  );
}
