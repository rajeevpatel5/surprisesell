import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";
import { authConfig } from "@/lib/auth.config";

/**
 * AUTH PROVIDER SEAM
 * ------------------
 * Local credentials against `User` + bcrypt. Cognito can replace the provider later.
 * Edge middleware uses auth.config.ts only (no Prisma) to stay under Vercel size limits.
 */

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: Role;
      universityId: string | null;
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          universityId: user.universityId,
        };
      },
    }),
  ],
});

/** Server-side helper: throws if there is no session, or the role isn't allowed. */
export async function requireRole(allowed: Role[]) {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHENTICATED");
  if (!allowed.includes(session.user.role)) throw new Error("FORBIDDEN");
  return session;
}
