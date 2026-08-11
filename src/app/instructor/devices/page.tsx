import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge, PageHeader } from "@/components/ui/primitives";

export default async function InstructorDevicesPage() {
  const session = await auth();
  const devices = await prisma.device.findMany({
    where: { universityId: session!.user.universityId! },
    include: { reservations: { where: { status: "ACTIVE" }, include: { student: true } } },
    orderBy: { deviceId: "asc" },
  });

  return (
    <div>
      <PageHeader title="Lab Devices" subtitle="Monitor hardware status and active reservations." />
      <div className="space-y-3">
        {devices.map((d) => (
          <Card key={d.id}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">{d.deviceId}</p>
                <p className="text-xs text-slate-500">{d.labLocation} · firmware {d.firmwareVersion}</p>
              </div>
              <Badge tone={d.status === "AVAILABLE" ? "success" : d.status === "OFFLINE" ? "danger" : "warning"}>
                {d.status}
              </Badge>
            </div>
            {d.reservations[0] && (
              <p className="mt-2 text-xs text-slate-500">
                In use by {d.reservations[0].student.firstName} {d.reservations[0].student.lastName} until{" "}
                {d.reservations[0].endTime.toLocaleTimeString()}
              </p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
