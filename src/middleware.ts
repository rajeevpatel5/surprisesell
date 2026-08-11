import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;
  const role = req.auth?.user?.role;

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

  if (!match) return NextResponse.next();

  if (!isLoggedIn || !role) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!prefixes[match].includes(role)) {
    return NextResponse.redirect(new URL("/forbidden", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/student/:path*",
    "/instructor/:path*",
    "/admin/:path*",
    "/orders/:path*",
    "/rentals/:path*",
    "/account/:path*",
  ],
};
