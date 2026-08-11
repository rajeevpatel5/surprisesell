import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Reservation locking (section 12 / 23): a device can only be RESERVED by one
 * student at a time. We enforce this with a transaction that re-checks the
 * device's status before creating the reservation, so two concurrent
 * requests can't both win.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const { deviceId, minutes = 30 } = (await req.json()) as { deviceId: string; minutes?: number };

  try {
    const reservation = await prisma.$transaction(async (tx) => {
      const device = await tx.device.findUnique({ where: { id: deviceId } });
      if (!device) throw new Error("NOT_FOUND");
      if (device.status !== "AVAILABLE") throw new Error("UNAVAILABLE");

      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + minutes * 60 * 1000);

      const res = await tx.deviceReservation.create({
        data: { deviceId, studentId: session.user.id, startTime, endTime, status: "ACTIVE" },
      });
      await tx.device.update({ where: { id: deviceId }, data: { status: "RESERVED" } });
      return res;
    });
    return NextResponse.json({ reservation });
  } catch (e: any) {
    const message = e.message === "UNAVAILABLE" ? "Device is no longer available." : "Reservation failed.";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}

/** Ends a reservation early or expires it: stop device, clear session, return to AVAILABLE (section 12). */
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { reservationId } = (await req.json()) as { reservationId: string };

  const reservation = await prisma.deviceReservation.findUnique({ where: { id: reservationId } });
  if (!reservation || reservation.studentId !== session.user.id) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.deviceReservation.update({ where: { id: reservationId }, data: { status: "COMPLETED" } }),
    prisma.device.update({ where: { id: reservation.deviceId }, data: { status: "AVAILABLE" } }),
  ]);

  return NextResponse.json({ ok: true });
}
