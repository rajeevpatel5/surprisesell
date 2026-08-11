import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { fulfillPaidOrder } from "@/lib/commerce";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "WEBHOOK_NOT_CONFIGURED" }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "MISSING_SIGNATURE" }, { status: 400 });
  }

  const body = await req.text();
  let event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    console.error("Stripe webhook signature error", err);
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      id: string;
      metadata?: { orderId?: string };
      payment_intent?: string | null;
    };
    const orderId = session.metadata?.orderId;
    if (orderId) {
      try {
        const paymentIntentId =
          typeof session.payment_intent === "string" ? session.payment_intent : null;
        await fulfillPaidOrder(orderId, paymentIntentId);
      } catch (err) {
        console.error("fulfillPaidOrder failed", err);
        return NextResponse.json({ error: "FULFILL_FAILED" }, { status: 500 });
      }
    } else {
      const order = await prisma.order.findUnique({ where: { stripeSessionId: session.id } });
      if (order) {
        const paymentIntentId =
          typeof session.payment_intent === "string" ? session.payment_intent : null;
        await fulfillPaidOrder(order.id, paymentIntentId);
      }
    }
  }

  return NextResponse.json({ received: true });
}
