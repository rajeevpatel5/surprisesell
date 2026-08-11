import { auth } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isPlatformAdmin = session?.user.role === "PLATFORM_ADMIN";

  const nav = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/devices", label: "Devices" },
    { href: "/admin/products", label: "Products" },
    { href: "/admin/fulfillment", label: "Fulfillment" },
    ...(isPlatformAdmin ? [{ href: "/admin/universities", label: "Universities" }] : []),
  ];

  return (
    <DashboardShell
      navItems={nav}
      roleLabel={isPlatformAdmin ? "Platform Administrator" : "University Administrator"}
      userName={session ? `${session.user.firstName} ${session.user.lastName}` : ""}
    >
      <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
    </DashboardShell>
  );
}
