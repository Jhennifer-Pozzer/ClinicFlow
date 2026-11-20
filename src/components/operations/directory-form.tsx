"use client";

import { useActionState, useRef, useState, startTransition } from "react";
import { useForm } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import {
  persistDirectory,
  type OperationState,
} from "@/app/(workspace)/operations-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { weekdays, type DirectoryKind } from "@/lib/operations";
import type {
  DirectoryForm as RecordForm,
  directoryOptions,
} from "@/server/operations/directory";
import { Field, FormError, Select } from "./fields";

type Options = Awaited<ReturnType<typeof directoryOptions>>;
type AvailabilityRow = NonNullable<RecordForm["availability"]>[number] & {
  key: number;
};

export function DirectoryEditor({
  kind,
  id,
  initial,
  options,
}: {
  kind: DirectoryKind;
  id: string | null;
  initial: RecordForm;
  options: Options;
}) {
  const [state, dispatch, pending] = useActionState(
    persistDirectory.bind(null, kind, id),
    {} satisfies OperationState,
  );
  const { register: registerField, handleSubmit } = useForm<
    Record<string, string>
  >({
    defaultValues: { ...initial.fields, name: initial.name },
  });
  const needsSpecialty = kind === "profissionais" || kind === "servicos";
  const register = (name: string) => ({
    ...registerField(name),
    defaultValue: name === "name" ? initial.name : (initial.fields[name] ?? ""),
  });

  return (
    <form
      action={dispatch}
      onSubmit={(event) => {
        const data = new FormData(event.currentTarget);
        void handleSubmit(() => startTransition(() => dispatch(data)))(event);
      }}
      className="grid gap-5 p-5 sm:p-6"
    >
      {state.message && <FormError message={state.message} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="name"
          label={kind === "pacientes" ? "Nome completo" : "Nome"}
          className="sm:col-span-2"
        >
          <Input
            id="name"
            minLength={2}
            maxLength={120}
            required
            {...register("name")}
          />
        </Field>
        {kind === "pacientes" && (
          <>
            <Field id="birthDate" label="Data de nascimento">
              <Input
                id="birthDate"
                type="date"
                required
                {...register("birthDate")}
              />
            </Field>
            <Field id="internalCode" label="Identificador interno">
              <Input
                id="internalCode"
                minLength={2}
                maxLength={32}
                required
                {...register("internalCode")}
              />
            </Field>
          </>
        )}
        {(kind === "pacientes" || kind === "profissionais") && (
          <>
            <Field id="email" label="E-mail">
              <Input
                id="email"
                type="email"
                maxLength={254}
                {...register("email")}
              />
            </Field>
            <Field id="phone" label="Telefone">
              <Input
                id="phone"
                type="tel"
                maxLength={30}
                {...register("phone")}
              />
            </Field>
          </>
        )}
        {needsSpecialty && (
          <Field id="specialtyId" label="Especialidade">
            <Select id="specialtyId" required {...register("specialtyId")}>
              <option value="">Selecione</option>
              {options.specialties.map(({ id, name, active }) => (
                <option key={id} value={id}>
                  {name}
                  {!active && " (inativa)"}
                </option>
              ))}
            </Select>
          </Field>
        )}
        {kind === "profissionais" && (
          <>
            <Field id="registration" label="Registro profissional fictício">
              <Input
                id="registration"
                minLength={2}
                maxLength={48}
                required
                {...register("registration")}
              />
            </Field>
            <Field id="defaultDurationMinutes" label="Duração padrão (min)">
              <Input
                id="defaultDurationMinutes"
                type="number"
                min={5}
                max={720}
                placeholder="30"
                required
                {...register("defaultDurationMinutes")}
              />
            </Field>
            <Field id="userId" label="Conta de profissional vinculada">
              <Select id="userId" {...register("userId")}>
                <option value="">Sem conta vinculada</option>
                {options.users.map(({ id, name }) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </Select>
            </Field>
          </>
        )}
        {kind === "servicos" && (
          <>
            <Field id="durationMinutes" label="Duração (min)">
              <Input
                id="durationMinutes"
                type="number"
                min={5}
                max={720}
                required
                {...register("durationMinutes")}
              />
            </Field>
            <Field id="price" label="Valor em reais">
              <Input
                id="price"
                inputMode="decimal"
                placeholder="150,00"
                maxLength={10}
                required
                {...register("price")}
              />
            </Field>
            <Field id="description" label="Descrição" className="sm:col-span-2">
              <textarea
                id="description"
                className="w-full rounded-lg border border-slate-300 p-3 text-sm"
                rows={3}
                maxLength={500}
                required
                {...register("description")}
              />
            </Field>
          </>
        )}
        {kind === "pacientes" && (
          <Field
            id="administrativeNote"
            label="Observações administrativas"
            className="sm:col-span-2"
          >
            <textarea
              id="administrativeNote"
              className="w-full rounded-lg border border-slate-300 p-3 text-sm"
              rows={3}
              maxLength={500}
              {...register("administrativeNote")}
            />
            <p className="mt-1 text-xs text-muted">
              Use somente informações fictícias e administrativas.
            </p>
          </Field>
        )}
      </div>
      {kind === "profissionais" && (
        <AvailabilityEditor initial={initial.availability ?? []} />
      )}
      <label className="flex w-fit items-center gap-2 text-sm font-medium">
        <input
          name="active"
          type="checkbox"
          defaultChecked={initial.active}
          className="size-4 accent-primary"
        />
        {kind === "pacientes" ? "Paciente ativo" : "Cadastro ativo"}
      </label>
      {kind === "pacientes" && (
        <p className="-mt-3 text-xs text-muted">
          Desmarque para arquivar o cadastro e preservar o histórico.
        </p>
      )}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar cadastro"}
        </Button>
      </div>
    </form>
  );
}

function AvailabilityEditor({
  initial,
}: {
  initial: NonNullable<RecordForm["availability"]>;
}) {
  const nextKey = useRef(initial.length);
  const [rows, setRows] = useState<AvailabilityRow[]>(() =>
    initial.map((row, key) => ({ ...row, key })),
  );
  return (
    <fieldset className="grid gap-3 rounded-xl border border-border bg-surface p-4">
      <legend className="px-1 text-sm font-semibold">
        Horários de atendimento
      </legend>
      <p className="text-sm text-muted">
        Você pode incluir mais de uma faixa no mesmo dia.
      </p>
      {rows.map((row, index) => (
        <div
          key={row.key}
          className="grid grid-cols-[1fr_1fr_auto] items-end gap-2 sm:grid-cols-[minmax(0,1.4fr)_1fr_1fr_auto]"
        >
          <Field
            id={`weekday-${row.key}`}
            label={`Dia da faixa ${index + 1}`}
            className="col-span-3 sm:col-span-1"
          >
            <Select
              id={`weekday-${row.key}`}
              name="weekday"
              defaultValue={row.weekday}
            >
              {weekdays.map((day, index) => (
                <option key={day} value={index}>
                  {day}
                </option>
              ))}
            </Select>
          </Field>
          <Field id={`start-${row.key}`} label="Início">
            <Input
              id={`start-${row.key}`}
              name="start"
              type="time"
              required
              defaultValue={row.start}
            />
          </Field>
          <Field id={`end-${row.key}`} label="Fim">
            <Input
              id={`end-${row.key}`}
              name="end"
              inputMode="numeric"
              placeholder="HH:MM"
              pattern="(?:[01][0-9]|2[0-3]):[0-5][0-9]|24:00"
              required
              defaultValue={row.end}
            />
          </Field>
          <Button
            variant="ghost"
            className="px-3"
            type="button"
            aria-label={`Remover faixa ${index + 1}`}
            onClick={() => setRows(rows.filter(({ key }) => key !== row.key))}
          >
            <Trash2 size={17} aria-hidden="true" />
          </Button>
        </div>
      ))}
      <div>
        <Button
          variant="outline"
          type="button"
          disabled={rows.length >= 28}
          onClick={() =>
            setRows([
              ...rows,
              {
                key: nextKey.current++,
                weekday: 1,
                start: "08:00",
                end: "12:00",
              },
            ])
          }
        >
          <Plus size={16} aria-hidden="true" />
          Adicionar horário
        </Button>
      </div>
    </fieldset>
  );
}
