import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await context.params;
  const rental = await prisma.rental.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!rental) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  if (!["PAID", "SHIPPED", "DELIVERED"].includes(rental.status)) {
    return NextResponse.json({ error: "INVALID_STATUS" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.shipment.create({
      data: {
        rentalId: rental.id,
        direction: "RETURN",
        carrier: "Customer",
        trackingNumber: "PENDING-CUSTOMER",
        shippedAt: new Date(),
      },
    }),
    prisma.rental.update({
      where: { id: rental.id },
      data: { status: "RETURN_SHIPPED" },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
