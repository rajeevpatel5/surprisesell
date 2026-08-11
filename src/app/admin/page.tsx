import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatCard, PageHeader, Card, Badge } from "@/components/ui/primitives";

export default async function AdminOverviewPage() {
  const session = await auth();
  const isPlatformAdmin = session!.user.role === "PLATFORM_ADMIN";

  if (isPlatformAdmin) {
    const [universityCount, userCount, deviceCount, universities] = await Promise.all([
      prisma.university.count(),
      prisma.user.count(),
      prisma.device.count(),
      prisma.university.findMany({ include: { users: true, devices: true, subscription: true } }),
    ]);

    return (
      <div>
        <PageHeader title="Platform Overview" subtitle="All universities on SurpriseSell." />
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Universities" value={universityCount} />
          <StatCard label="Total Users" value={userCount} />
          <StatCard label="Total Devices" value={deviceCount} />
        </div>
        <Card>
          <div className="divide-y divide-slate-800">
            {universities.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm text-slate-200">{u.name}</p>
                  <p className="text-xs text-slate-500">
                    {u.users.length} users · {u.devices.length} devices · {u.subscription?.plan ?? "no plan"}
                  </p>
                </div>
                <Badge tone={u.status === "ACTIVE" ? "success" : u.status === "SUSPENDED" ? "danger" : "warning"}>
                  {u.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // University admin: scoped to their own university
  const universityId = session!.user.universityId!;
  const [studentCount, instructorCount, courseCount, deviceCount] = await Promise.all([
    prisma.user.count({ where: { universityId, role: "STUDENT" } }),
    prisma.user.count({ where: { universityId, role: "INSTRUCTOR" } }),
    prisma.course.count({ where: { universityId } }),
    prisma.device.count({ where: { universityId } }),
  ]);

  return (
    <div>
      <PageHeader title="University Overview" subtitle="Usage across your institution." />
      <div className="grid sm:grid-cols-4 gap-4">
        <StatCard label="Students" value={studentCount} />
        <StatCard label="Instructors" value={instructorCount} />
        <StatCard label="Courses" value={courseCount} />
        <StatCard label="Devices" value={deviceCount} />
      </div>
    </div>
  );
}
