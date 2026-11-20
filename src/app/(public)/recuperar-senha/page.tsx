import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { AuthForm } from "../auth-form";

export const metadata = { title: "Recuperar senha" };

export default function RecoveryPage() {
  return (
    <AuthCard
      title="Recuperar senha"
      description="Informe o e-mail cadastrado para solicitar um link de redefinição."
    >
      <AuthForm mode="recovery" />
      <Link
        href="/entrar"
        className="mt-5 inline-block text-sm font-semibold text-blue-700 underline-offset-4 hover:underline"
      >
        Voltar para entrar
      </Link>
    </AuthCard>
  );
}
