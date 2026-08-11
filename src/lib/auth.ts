import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

/**
 * AUTH PROVIDER SEAM
 * ------------------
 * The MVP authenticates against the local `User` table (email + bcrypt hash)
 * so the app is runnable without any cloud dependency.
 *
 * Production path: replace this Credentials provider with next-auth's Cognito
 * provider (or a custom OIDC provider pointed at the Cognito User Pool /
 * COGNITO_USER_POOL_ID + COGNITO_CLIENT_ID from .env). Because role, university,
 * and id are read from the `User` row keyed by email in both cases, no other
 * part of the app needs to change — `session.user.role` and
 * `session.user.universityId` remain the contract every dashboard depends on.
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
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
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
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.universityId = (user as any).universityId;
        token.firstName = (user as any).firstName;
        token.lastName = (user as any).lastName;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      session.user.universityId = token.universityId as string | null;
      session.user.firstName = token.firstName as string;
      session.user.lastName = token.lastName as string;
      return session;
    },
  },
});

/** Server-side helper: throws if there is no session, or the role isn't allowed. */
export async function requireRole(allowed: Role[]) {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHENTICATED");
  if (!allowed.includes(session.user.role)) throw new Error("FORBIDDEN");
  return session;
}
