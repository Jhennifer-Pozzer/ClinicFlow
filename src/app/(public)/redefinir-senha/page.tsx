import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { resetToken } from "@/server/auth/schemas";
import { AuthForm } from "../auth-form";

export const metadata = { title: "Redefinir senha" };

export default async function ResetPage({
  searchParams,
}: PageProps<"/redefinir-senha">) {
  const result = resetToken.safeParse((await searchParams).token);
  return (
    <AuthCard
      title="Redefinir senha"
      description={
        result.success
          ? "Escolha uma senha com pelo menos 12 caracteres."
          : "Solicite um novo link para continuar."
      }
    >
      {result.success ? (
        <AuthForm mode="reset" token={result.data} />
      ) : (
        <Link
          href="/recuperar-senha"
          className="text-sm font-semibold text-blue-700 underline-offset-4 hover:underline"
        >
          Solicitar novo link
        </Link>
      )}
    </AuthCard>
  );
}
