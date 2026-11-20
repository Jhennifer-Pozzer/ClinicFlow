"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { Bell, ChevronDown, LogOut, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { initials } from "@/lib/format";
import type { DashboardAlert, DashboardSection } from "./sections";

const iconStyle =
  "grid size-10 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-slate-100 hover:text-ink";

function closeOnEscape(event: KeyboardEvent<HTMLDetailsElement>) {
  if (event.key !== "Escape" || !event.currentTarget.open) return;
  event.currentTarget.open = false;
  event.currentTarget.querySelector("summary")?.focus();
}

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function SearchControl({ sections }: { sections: DashboardSection[] }) {
  const modal = useRef<HTMLDialogElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const terms = normalize(query.trim()).split(/\s+/);
  const matches = sections.filter(({ label, keywords }) =>
    terms.every((term) => normalize(`${label} ${keywords}`).includes(term)),
  );

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label="Buscar no painel"
        onClick={() => {
          setQuery("");
          modal.current?.showModal();
          searchInput.current?.focus();
        }}
        className="flex h-10 items-center gap-2 rounded-lg px-2.5 text-sm text-muted hover:bg-slate-100 sm:min-w-42 sm:border sm:border-border sm:bg-surface"
      >
        <Search size={17} aria-hidden="true" />
        <span className="hidden sm:inline">Buscar no painel</span>
      </button>
      <dialog
        ref={modal}
        aria-labelledby="buscar-titulo"
        className="fixed inset-0 m-auto max-h-[80dvh] w-[calc(100%-2rem)] max-w-md rounded-2xl border border-border bg-white p-5 text-ink shadow-xl backdrop:bg-slate-950/35"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="buscar-titulo" className="font-semibold">
            Buscar seções do painel
          </h2>
          <button
            type="button"
            aria-label="Fechar busca"
            className={iconStyle}
            onClick={() => modal.current?.close()}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <label htmlFor="busca-painel" className="sr-only">
          Pesquisar seção
        </label>
        <Input
          ref={searchInput}
          id="busca-painel"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ex. agenda, indicadores ou financeiro"
        />
        {matches.length ? (
          <ul className="mt-3 grid gap-1">
            {matches.map(({ id, label, href }) => (
              <li key={id}>
                <a
                  href={href ?? `#${id}`}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-blue-50 hover:text-blue-800"
                  onClick={() => modal.current?.close()}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p role="status" className="px-1 py-4 text-sm text-muted">
            Nenhuma seção encontrada.
          </p>
        )}
      </dialog>
    </>
  );
}

export function Notifications({ alerts }: { alerts: DashboardAlert[] }) {
  return (
    <details onKeyDown={closeOnEscape} className="relative">
      <summary
        aria-label={
          alerts.length
            ? `Notificações, ${alerts.length} alertas`
            : "Notificações"
        }
        className={`${iconStyle} relative cursor-pointer list-none`}
      >
        <Bell size={19} aria-hidden="true" />
        {alerts.length > 0 && (
          <span
            aria-hidden="true"
            className="absolute top-1.5 right-1.5 size-2.5 rounded-full border-2 border-white bg-primary"
          />
        )}
      </summary>
      <div className="absolute top-12 -right-14 z-30 w-[min(19rem,calc(100vw-2rem))] rounded-xl border border-border bg-white p-2 shadow-xl sm:right-0">
        <p className="px-2 py-2 text-sm font-semibold">Notificações</p>
        {alerts.length ? (
          <ul className="grid gap-1">
            {alerts.map(({ title, detail, section }) => (
              <li key={title}>
                <a
                  href={`#${section}`}
                  onClick={(event) =>
                    event.currentTarget
                      .closest("details")
                      ?.removeAttribute("open")
                  }
                  className="block rounded-lg p-2 hover:bg-surface"
                >
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="mt-0.5 block text-sm text-muted">
                    {detail}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-2 py-3 text-sm text-muted">
            Nenhum alerta pendente.
          </p>
        )}
      </div>
    </details>
  );
}

export function ProfileMenu({
  name,
  email,
  role,
  logout,
}: {
  name: string;
  email: string;
  role: string;
  logout: () => Promise<void>;
}) {
  return (
    <details onKeyDown={closeOnEscape} className="relative">
      <summary
        aria-label="Menu do perfil"
        className="flex cursor-pointer list-none items-center gap-2 rounded-xl p-1 transition hover:bg-slate-100"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-100 text-sm font-semibold text-blue-800">
          {initials(name)}
        </span>
        <span className="hidden text-left lg:block">
          <span className="block max-w-34 truncate text-sm font-semibold">
            {name}
          </span>
          <span className="block text-xs text-muted">{role}</span>
        </span>
        <ChevronDown
          size={14}
          className="hidden text-muted sm:block"
          aria-hidden="true"
        />
      </summary>
      <div className="absolute top-12 right-0 z-30 w-59 rounded-xl border border-border bg-white p-2 shadow-xl">
        <div className="border-b border-border px-2 py-2.5">
          <p className="font-semibold">{name}</p>
          <p className="break-all text-sm text-muted">{email}</p>
          <p className="mt-1 text-xs text-muted lg:hidden">{role}</p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="mt-1 flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm font-semibold text-red-800 hover:bg-red-50"
          >
            <LogOut size={16} aria-hidden="true" />
            Sair
          </button>
        </form>
      </div>
    </details>
  );
}
