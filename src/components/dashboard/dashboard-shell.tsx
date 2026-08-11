"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export interface NavItem {
  href: string;
  label: string;
}

export function DashboardShell({
  navItems,
  roleLabel,
  userName,
  children,
}: {
  navItems: NavItem[];
  roleLabel: string;
  userName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      <aside className="w-60 shrink-0 border-r border-slate-800 flex flex-col">
        <div className="px-5 py-5 border-b border-slate-800">
          <Link href="/" className="text-lg font-semibold text-white">
            SurpriseSell
          </Link>
          <p className="text-xs text-slate-500 mt-0.5">{roleLabel}</p>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? "bg-brand-500/15 text-brand-300 font-medium"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-4 border-t border-slate-800">
          <p className="text-sm text-slate-300 truncate">{userName}</p>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="mt-2 text-xs text-slate-500 hover:text-slate-300"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto scrollbar-thin">{children}</main>
    </div>
  );
}
