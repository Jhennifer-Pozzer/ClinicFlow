"use server";

import { AuthError } from "next-auth";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { allowAttempt } from "@/server/auth/rate-limit";
import { applyPasswordReset, issuePasswordReset } from "@/server/auth/recovery";
import {
  loginSchema,
  recoverySchema,
  resetSchema,
} from "@/server/auth/schemas";

export type FormFeedback = { message: string; success?: boolean } | null;

export async function enterDemo() {
  try {
    await signIn("demonstracao", { redirectTo: "/painel" });
  } catch (error) {
    if (error instanceof AuthError)
      redirect("/demonstracao?status=indisponivel");
    throw error;
  }
}

export async function login(
  _: FormFeedback,
  form: FormData,
): Promise<FormFeedback> {
  const input = loginSchema.safeParse(Object.fromEntries(form));
  if (!input.success)
    return { message: "Informe um e-mail e uma senha válidos." };

  try {
    await signIn("credentials", { ...input.data, redirectTo: "/painel" });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        message:
          "Não foi possível entrar. Confira as credenciais ou tente novamente mais tarde.",
      };
    }
    throw error;
  }

  redirect("/painel");
}

export async function requestRecovery(
  _: FormFeedback,
  form: FormData,
): Promise<FormFeedback> {
  const input = recoverySchema.safeParse(Object.fromEntries(form));
  if (!input.success) return { message: "Informe um e-mail válido." };

  const { email } = input.data;
  try {
    if (await allowAttempt("request-reset", email)) {
      after(async () => {
        try {
          await issuePasswordReset(email);
        } catch {
          console.error("Falha ao processar a recuperação de senha.");
        }
      });
    }
  } catch {
    console.error("Falha ao verificar o limite de recuperação de senha.");
  }

  return {
    message:
      "Se a conta estiver disponível, enviaremos um link de recuperação.",
    success: true,
  };
}

export async function resetPassword(
  _: FormFeedback,
  form: FormData,
): Promise<FormFeedback> {
  const input = resetSchema.safeParse(Object.fromEntries(form));
  if (!input.success)
    return {
      message:
        "Use de 12 a 128 caracteres e confirme a mesma senha nos dois campos.",
    };

  try {
    if (!(await applyPasswordReset(input.data.token, input.data.password))) {
      return { message: "Link inválido ou expirado. Solicite um novo link." };
    }
  } catch {
    console.error("Falha ao redefinir a senha.");
    return {
      message:
        "Não foi possível redefinir a senha. Tente novamente mais tarde.",
    };
  }

  redirect("/entrar?senha=atualizada");
}
