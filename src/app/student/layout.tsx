import { auth } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

const NAV = [
  { href: "/student", label: "Dashboard" },
  { href: "/student/courses", label: "Courses" },
  { href: "/student/lab", label: "Virtual Lab" },
  { href: "/student/iot-dashboard", label: "IoT Dashboard" },
  { href: "/student/assignments", label: "Assignments" },
  { href: "/student/projects", label: "Projects" },
  { href: "/student/devices", label: "Remote Lab" },
  { href: "/shop", label: "Shop" },
  { href: "/orders", label: "Orders" },
  { href: "/rentals", label: "Rentals" },
  { href: "/account/addresses", label: "Addresses" },
];

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <DashboardShell
      navItems={NAV}
      roleLabel="Student"
      userName={session ? `${session.user.firstName} ${session.user.lastName}` : ""}
    >
      <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
    </DashboardShell>
  );
}
