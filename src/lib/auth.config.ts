import type { NextAuthConfig } from "next-auth";

type Role = "STUDENT" | "INSTRUCTOR" | "UNIVERSITY_ADMIN" | "PLATFORM_ADMIN";

/**
 * Edge-safe Auth.js config (no Prisma / bcrypt).
 * Used by middleware. Full Credentials provider lives in auth.ts.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as {
          id?: string;
          role?: Role;
          universityId?: string | null;
          firstName?: string;
          lastName?: string;
        };
        token.id = u.id;
        token.role = u.role;
        token.universityId = u.universityId;
        token.firstName = u.firstName;
        token.lastName = u.lastName;
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
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const prefixes: Record<string, string[]> = {
        "/student": ["STUDENT"],
        "/instructor": ["INSTRUCTOR"],
        "/admin": ["UNIVERSITY_ADMIN", "PLATFORM_ADMIN"],
        "/orders": ["STUDENT", "INSTRUCTOR", "UNIVERSITY_ADMIN", "PLATFORM_ADMIN"],
        "/rentals": ["STUDENT", "INSTRUCTOR", "UNIVERSITY_ADMIN", "PLATFORM_ADMIN"],
        "/account": ["STUDENT", "INSTRUCTOR", "UNIVERSITY_ADMIN", "PLATFORM_ADMIN"],
      };
      const match = Object.keys(prefixes)
        .sort((a, b) => b.length - a.length)
        .find((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
      if (!match) return true;
      const role = auth?.user?.role as string | undefined;
      if (!role) return false;
      return prefixes[match].includes(role);
    },
  },
} satisfies NextAuthConfig;
