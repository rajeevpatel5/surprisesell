import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge, PageHeader } from "@/components/ui/primitives";
import { redirect } from "next/navigation";

export default async function AdminUniversitiesPage() {
  const session = await auth();
  if (session!.user.role !== "PLATFORM_ADMIN") redirect("/admin");

  const universities = await prisma.university.findMany({
    include: { users: true, devices: true, subscription: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Universities" subtitle="Every institution on the platform." />
      <div className="grid sm:grid-cols-2 gap-4">
        {universities.map((u) => (
          <Card key={u.id}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">{u.name}</h3>
              <Badge tone={u.status === "ACTIVE" ? "success" : u.status === "SUSPENDED" ? "danger" : "warning"}>
                {u.status}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {u.users.length} users · {u.devices.length} devices · plan: {u.subscription?.plan ?? "none"}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
