import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge, PageHeader } from "@/components/ui/primitives";

export default async function AdminUsersPage() {
  const session = await auth();
  const isPlatformAdmin = session!.user.role === "PLATFORM_ADMIN";

  const users = await prisma.user.findMany({
    where: isPlatformAdmin ? {} : { universityId: session!.user.universityId! },
    include: { university: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <PageHeader title="Users" subtitle={isPlatformAdmin ? "All users across every university." : "Users at your university."} />
      <Card>
        <div className="divide-y divide-slate-800">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-sm text-slate-200">{u.firstName} {u.lastName}</p>
                <p className="text-xs text-slate-500">
                  {u.email} {isPlatformAdmin && u.university ? `· ${u.university.name}` : ""}
                </p>
              </div>
              <Badge>{u.role.replace("_", " ")}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
