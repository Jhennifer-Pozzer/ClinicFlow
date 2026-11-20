import NextAuth, { AuthError } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authenticate } from "@/server/auth/credentials";
import { authenticateDemo } from "@/server/auth/demo";
import { database } from "@/server/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: { signIn: "/entrar" },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: authenticate,
    }),
    Credentials({
      id: "demonstracao",
      name: "Demonstração",
      credentials: {},
      authorize: authenticateDemo,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.organizationId = user.organizationId;
        token.sessionVersion = user.sessionVersion;
        return token;
      }
      if (
        !token.sub ||
        !token.organizationId ||
        typeof token.sessionVersion !== "number"
      )
        return null;
      const account = await database().user.findFirst({
        where: {
          id: token.sub,
          organizationId: token.organizationId,
          sessionVersion: token.sessionVersion,
          active: true,
        },
        select: { id: true },
      });
      return account ? token : null;
    },
    session({ session, token }) {
      if (
        token.sub &&
        token.organizationId &&
        typeof token.sessionVersion === "number"
      ) {
        session.user.id = token.sub;
        session.user.organizationId = token.organizationId;
        session.user.sessionVersion = token.sessionVersion;
      }
      return session;
    },
  },
  logger: {
    error(error) {
      // Erros da infraestrutura podem conter parâmetros privados no objeto.
      const type = error instanceof AuthError ? error.type : "Error";
      if (type !== "CredentialsSignin") console.error("Falha no Auth.js", type);
    },
  },
});
