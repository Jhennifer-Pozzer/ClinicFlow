import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { currentActor } from "@/server/auth/access";
import { AuthForm } from "../auth-form";

export const metadata = { title: "Entrar" };

export default async function LoginPage({
  searchParams,
}: PageProps<"/entrar">) {
  if (await currentActor()) redirect("/painel");
  const params = await searchParams;
  return (
    <AuthCard
      title="Entrar no ClinicFlow"
      description="Acesse a área administrativa com sua conta."
    >
      {params.senha === "atualizada" && (
        <p role="status" className="mb-4 text-sm text-emerald-800">
          Senha atualizada. Entre com a nova senha.
        </p>
      )}
      <AuthForm mode="login" />
      <Link
        href="/recuperar-senha"
        className="mt-5 inline-block text-sm font-semibold text-blue-700 underline-offset-4 hover:underline"
      >
        Esqueci minha senha
      </Link>
    </AuthCard>
  );
}
