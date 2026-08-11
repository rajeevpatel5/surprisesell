import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { releaseRentalDeposit } from "@/lib/commerce";
import { getStripe } from "@/lib/stripe";

const bodySchema = z.object({
  rentalId: z.string().min(1),
  releaseDeposit: z.boolean().default(true),
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
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION" }, { status: 400 });
  }

  const rental = await prisma.rental.findUnique({
    where: { id: parsed.data.rentalId },
    include: {
      orderItem: { include: { order: true } },
    },
  });
  if (!rental) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.rental.update({
      where: { id: rental.id },
      data: { status: "RETURNED", returnedAt: new Date() },
    });
    if (parsed.data.releaseDeposit) {
      await releaseRentalDeposit(tx, rental.id);
    }
  });

  // Best-effort Stripe refund of deposit amount when payment intent exists
  if (
    parsed.data.releaseDeposit &&
    rental.depositCents > 0 &&
    rental.orderItem.order.stripePaymentIntentId &&
    process.env.STRIPE_SECRET_KEY
  ) {
    try {
      await getStripe().refunds.create({
        payment_intent: rental.orderItem.order.stripePaymentIntentId,
        amount: rental.depositCents,
        reason: "requested_by_customer",
        metadata: { rentalId: rental.id, type: "deposit_release" },
      });
    } catch (err) {
      console.error("Deposit refund failed (marked released in DB)", err);
    }
  }

  return NextResponse.json({ ok: true });
}
