import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/ui/primitives";
import { RemoteLabPanel } from "@/components/lab/remote-lab-panel";
import { Video } from "lucide-react";

export default async function RemoteLabPage() {
  const session = await auth();
  const universityId = session!.user.universityId!;

  const [devices, activeReservation] = await Promise.all([
    prisma.device.findMany({ where: { universityId }, orderBy: { deviceId: "asc" } }),
    prisma.deviceReservation.findFirst({
      where: { studentId: session!.user.id, status: "ACTIVE" },
      include: { device: true },
    }),
  ]);

  return (
    <div>
      <PageHeader title="Remote Lab" subtitle="Reserve real ESP32 hardware and control it live." />
      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <RemoteLabPanel
            devices={devices.map((d) => ({
              id: d.id,
              deviceId: d.deviceId,
              labLocation: d.labLocation,
              status: d.status,
              firmwareVersion: d.firmwareVersion,
            }))}
            activeReservation={
              activeReservation
                ? {
                    id: activeReservation.id,
                    deviceId: activeReservation.deviceId,
                    endTime: activeReservation.endTime.toISOString(),
                    device: { deviceId: activeReservation.device.deviceId },
                  }
                : null
            }
          />
        </div>
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500 mb-3">Live Lab Camera</p>
          <div className="aspect-video rounded-lg border border-dashed border-slate-700 bg-slate-950 flex flex-col items-center justify-center text-slate-600">
            <Video size={28} />
            <p className="mt-2 text-xs">
              Live video placeholder — production wires this to AWS Kinesis Video Streams or Amazon IVS.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
