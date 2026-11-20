import type { DefaultSession } from "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    organizationId: string;
    sessionVersion: number;
  }

  interface Session {
    user: NonNullable<DefaultSession["user"]> & {
      id: string;
      organizationId?: string;
      sessionVersion?: number;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    organizationId?: string;
    sessionVersion?: number;
  }
}
