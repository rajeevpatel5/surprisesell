import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const ROLE_PREFIXES: Record<string, string[]> = {
  "/student": ["STUDENT"],
  "/instructor": ["INSTRUCTOR"],
  "/admin": ["UNIVERSITY_ADMIN", "PLATFORM_ADMIN"],
  "/orders": ["STUDENT", "INSTRUCTOR", "UNIVERSITY_ADMIN", "PLATFORM_ADMIN"],
  "/rentals": ["STUDENT", "INSTRUCTOR", "UNIVERSITY_ADMIN", "PLATFORM_ADMIN"],
  "/account": ["STUDENT", "INSTRUCTOR", "UNIVERSITY_ADMIN", "PLATFORM_ADMIN"],
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const match = Object.keys(ROLE_PREFIXES)
    .sort((a, b) => b.length - a.length)
    .find((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
  if (!match) return NextResponse.next();

  const role = req.auth?.user?.role;
  if (!role) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }
  if (!ROLE_PREFIXES[match].includes(role)) {
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
