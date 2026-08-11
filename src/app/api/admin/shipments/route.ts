import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const shipSchema = z.object({
  orderId: z.string().optional(),
  rentalId: z.string().optional(),
  direction: z.enum(["OUTBOUND", "RETURN"]),
  carrier: z.string().min(1).max(80),
  trackingNumber: z.string().min(1).max(120),
});

export async function POST(req: Request) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== "PLATFORM_ADMIN" && session.user.role !== "UNIVERSITY_ADMIN")
  ) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = shipSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION" }, { status: 400 });
  }

  const { orderId, rentalId, direction, carrier, trackingNumber } = parsed.data;
  if (!orderId && !rentalId) {
    return NextResponse.json({ error: "ORDER_OR_RENTAL_REQUIRED" }, { status: 400 });
  }

  const shipment = await prisma.$transaction(async (tx) => {
    const created = await tx.shipment.create({
      data: {
        orderId: orderId || null,
        rentalId: rentalId || null,
        direction,
        carrier,
        trackingNumber,
        shippedAt: new Date(),
      },
    });

    if (direction === "OUTBOUND") {
      if (orderId) {
        await tx.order.update({ where: { id: orderId }, data: { status: "SHIPPED" } });
      }
      if (rentalId) {
        await tx.rental.update({ where: { id: rentalId }, data: { status: "SHIPPED" } });
      }
    }

    if (direction === "RETURN" && rentalId) {
      await tx.rental.update({
        where: { id: rentalId },
        data: { status: "RETURN_SHIPPED" },
      });
    }

    return created;
  });

  return NextResponse.json({ shipment });
}
