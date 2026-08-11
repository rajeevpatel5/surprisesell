import { auth } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

const NAV = [
  { href: "/instructor", label: "Overview" },
  { href: "/instructor/courses", label: "Courses" },
  { href: "/instructor/submissions", label: "Submissions" },
  { href: "/instructor/devices", label: "Devices" },
];

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <DashboardShell
      navItems={NAV}
      roleLabel="Instructor"
      userName={session ? `${session.user.firstName} ${session.user.lastName}` : ""}
    >
      <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
    </DashboardShell>
  );
}
