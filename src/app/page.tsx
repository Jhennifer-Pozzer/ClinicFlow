import Image from "next/image";
import Link from "next/link";
import { Check, ChevronDown, Columns3, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/brand";
import { buttonStyles } from "@/components/ui/button";
import { SiteHeader } from "@/components/landing/site-header";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { faqs, features, steps } from "@/components/landing/content";

export default function Home() {
  return (
    <div className="bg-white">
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-3"
        href="#conteudo"
      >
        Pular para o conteúdo
      </a>
      <SiteHeader />
      <main id="conteudo">
        <section className="overflow-hidden border-b border-blue-100 bg-linear-to-br from-white via-[#f8faff] to-[#eaf2ff]">
          <div className="mx-auto grid max-w-7xl items-center gap-9 px-5 py-13 sm:px-8 sm:py-17 lg:grid-cols-[0.93fr_1.07fr] lg:gap-14 lg:px-12 lg:py-22">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-sm font-medium text-navy">
                <Columns3 size={15} aria-hidden="true" /> Gestão para clínicas
              </p>
              <h1 className="mt-6 max-w-2xl text-[2.75rem] leading-[1.02] font-bold tracking-[-0.065em] text-balance sm:text-6xl lg:text-[4.45rem]">
                A rotina da sua clínica{" "}
                <span className="text-primary">em um só lugar.</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
                Acompanhe a agenda, os próximos atendimentos e os indicadores da
                clínica em um painel compartilhado pela equipe.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/demonstracao"
                  className={buttonStyles({ className: "min-h-12 px-5" })}
                >
                  Experimentar demonstração
                </Link>
                <a
                  href="#visao-do-painel"
                  className={buttonStyles({
                    variant: "outline",
                    className: "min-h-12 px-5",
                  })}
                >
                  Conhecer o painel
                </a>
              </div>
              <p className="mt-5 flex items-center gap-2 text-sm text-muted">
                <ShieldCheck
                  size={16}
                  className="text-teal-700"
                  aria-hidden="true"
                />{" "}
                Demonstração com dados fictícios
              </p>
            </div>
            <div className="relative aspect-[1.45] overflow-hidden rounded-[1.65rem] border border-slate-900/10 bg-blue-50 shadow-xl shadow-blue-950/10 lg:aspect-[1.26]">
              <Image
                src="/media/recepcao-clinicflow.webp"
                alt="Recepcionista e coordenadora consultam a agenda no computador da recepção"
                fill
                preload
                sizes="(max-width: 1023px) 95vw, 590px"
                className="object-cover object-[51%_center]"
              />
            </div>
          </div>
        </section>

        <section
          id="funcionalidades"
          className="mx-auto max-w-7xl scroll-mt-6 px-5 py-16 sm:px-8 sm:py-22 lg:px-12"
        >
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            O que sua equipe acompanha no ClinicFlow
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {features.map(({ title, description, icon: Icon, color }) => (
              <article
                key={title}
                className="rounded-2xl border border-border p-6 shadow-panel"
              >
                <span
                  className={`grid size-11 place-items-center rounded-xl ${color}`}
                >
                  <Icon size={22} aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">
                  {title}
                </h3>
                <p className="mt-2 leading-relaxed text-muted">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="visao-do-painel"
          className="scroll-mt-6 bg-[#12254c] text-white"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-15 sm:px-8 sm:py-20 lg:grid-cols-[0.75fr_1.25fr] lg:gap-14 lg:px-12">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Entenda o dia antes do primeiro atendimento
              </h2>
              <p className="mt-4 max-w-md leading-relaxed text-blue-100">
                Reúna na mesma tela o que a equipe precisa conferir ao começar o
                turno.
              </p>
              <ul className="mt-6 grid gap-3 text-sm text-blue-50 sm:text-base">
                {[
                  "Horários e status das consultas",
                  "Atendimentos que aguardam confirmação",
                  "Receitas recebidas e valores pendentes",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check
                      size={18}
                      className="mt-0.5 shrink-0 text-teal-300"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <DashboardPreview />
          </div>
        </section>

        <section
          id="como-funciona"
          className="mx-auto max-w-7xl scroll-mt-6 px-5 py-16 sm:px-8 sm:py-22 lg:px-12"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Como funciona
          </h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {steps.map(({ title, description }, index) => (
              <li key={title} className="border-t border-blue-200 pt-5">
                <span className="grid size-8 place-items-center rounded-full bg-blue-50 text-sm font-semibold text-blue-800">
                  {index + 1}
                </span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section
          id="faq"
          className="scroll-mt-6 border-y border-border bg-surface"
        >
          <div className="mx-auto grid max-w-7xl gap-7 px-5 py-14 sm:px-8 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16 lg:px-12 lg:py-18">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Perguntas frequentes
            </h2>
            <div className="grid gap-3">
              {faqs.map(({ question, answer }) => (
                <details
                  key={question}
                  className="group rounded-xl border border-border bg-white px-4 sm:px-5"
                >
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-semibold">
                    {question}
                    <ChevronDown
                      className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <p className="pb-4 leading-relaxed text-muted">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-5 py-14 sm:px-8 lg:px-12">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Conheça a Clínica Vida Plena
            </h2>
            <p className="mt-2 text-muted">
              Explore a agenda e os indicadores de uma clínica fictícia.
            </p>
          </div>
          <Link href="/demonstracao" className={buttonStyles()}>
            Experimentar demonstração
          </Link>
        </section>
      </main>
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-5 py-8 sm:px-8 lg:px-12">
          <Link href="/" aria-label="ClinicFlow, início">
            <Brand />
          </Link>
          <span className="text-sm text-muted">
            ClinicFlow · Projeto de portfólio
          </span>
          <Link
            href="/entrar"
            className="text-sm font-medium text-muted hover:text-primary"
          >
            Área administrativa
          </Link>
        </div>
      </footer>
    </div>
  );
}
