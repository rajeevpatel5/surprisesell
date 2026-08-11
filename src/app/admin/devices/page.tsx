import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge, PageHeader } from "@/components/ui/primitives";

export default async function AdminDevicesPage() {
  const session = await auth();
  const isPlatformAdmin = session!.user.role === "PLATFORM_ADMIN";

  const devices = await prisma.device.findMany({
    where: isPlatformAdmin ? {} : { universityId: session!.user.universityId! },
    include: { university: true },
    orderBy: { deviceId: "asc" },
  });

  return (
    <div>
      <PageHeader title="Devices" subtitle="Physical IoT hardware inventory and health." />
      <Card>
        <div className="divide-y divide-slate-800">
          {devices.map((d) => (
            <div key={d.id} className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-sm text-slate-200">{d.deviceId}</p>
                <p className="text-xs text-slate-500">
                  {isPlatformAdmin ? `${d.university.name} · ` : ""}
                  {d.labLocation} · firmware {d.firmwareVersion}
                </p>
              </div>
              <Badge tone={d.status === "AVAILABLE" ? "success" : d.status === "OFFLINE" ? "danger" : "warning"}>
                {d.status}
              </Badge>
            </div>
          ))}
          {devices.length === 0 && <p className="text-sm text-slate-500 py-2">No devices registered.</p>}
        </div>
      </Card>
    </div>
  );
}
