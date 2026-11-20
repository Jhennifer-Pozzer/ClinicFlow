"use client";

import { useActionState, type ComponentProps } from "react";
import { Root as Label } from "@radix-ui/react-label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login, requestRecovery, resetPassword } from "./auth-actions";

const forms = {
  login: { action: login, submit: "Entrar" },
  recovery: { action: requestRecovery, submit: "Enviar link" },
  reset: { action: resetPassword, submit: "Salvar nova senha" },
};

function Field({
  label,
  name,
  ...props
}: ComponentProps<"input"> & { label: string; name: string }) {
  return (
    <div>
      <Label htmlFor={name} className="mb-1.5 block text-sm font-medium">
        {label}
      </Label>
      <Input required id={name} name={name} {...props} />
    </div>
  );
}

export function AuthForm(
  props: { mode: "login" | "recovery" } | { mode: "reset"; token: string },
) {
  const { action, submit } = forms[props.mode];
  const [feedback, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-4">
      {props.mode !== "reset" && (
        <Field
          label="E-mail"
          name="email"
          type="email"
          autoComplete="username"
          maxLength={254}
        />
      )}
      {props.mode === "login" && (
        <Field
          label="Senha"
          name="password"
          type="password"
          autoComplete="current-password"
          maxLength={128}
        />
      )}
      {props.mode === "reset" && (
        <>
          <input type="hidden" name="token" value={props.token} />
          <Field
            label="Nova senha"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
          />
          <Field
            label="Confirme a senha"
            name="confirmation"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
          />
        </>
      )}
      {feedback && (
        <p
          role={feedback.success ? "status" : "alert"}
          className={
            feedback.success
              ? "text-sm text-emerald-800"
              : "text-sm text-red-800"
          }
        >
          {feedback.message}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Aguarde…" : submit}
      </Button>
    </form>
  );
}
