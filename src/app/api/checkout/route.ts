import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { orderKindFromItems } from "@/lib/commerce";
import { SHIPPING_CENTS } from "@/lib/tenant";

const itemSchema = z.object({
  productId: z.string().min(1),
  kind: z.enum(["BUY", "RENT"]),
  quantity: z.number().int().min(1).max(10),
});

const bodySchema = z.object({
  items: z.array(itemSchema).min(1),
  addressId: z.string().min(1),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION", details: parsed.error.flatten() }, { status: 400 });
  }

  const address = await prisma.address.findFirst({
    where: { id: parsed.data.addressId, userId: session.user.id },
  });
  if (!address) {
    return NextResponse.json({ error: "ADDRESS_NOT_FOUND" }, { status: 404 });
  }

  const productIds = parsed.data.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const lineDefs: {
    productId: string;
    kind: "BUY" | "RENT";
    quantity: number;
    unitPriceCents: number;
    depositCents: number;
    name: string;
  }[] = [];

  for (const item of parsed.data.items) {
    const product = byId.get(item.productId);
    if (!product) {
      return NextResponse.json({ error: "PRODUCT_NOT_FOUND", productId: item.productId }, { status: 404 });
    }
    if (product.stock < item.quantity) {
      return NextResponse.json({ error: "OUT_OF_STOCK", slug: product.slug }, { status: 409 });
    }
    if (item.kind === "BUY" && product.type === "RENTABLE") {
      return NextResponse.json({ error: "NOT_BUYABLE", slug: product.slug }, { status: 400 });
    }
    if (item.kind === "RENT" && product.type === "BUYABLE") {
      return NextResponse.json({ error: "NOT_RENTABLE", slug: product.slug }, { status: 400 });
    }

    if (item.kind === "BUY") {
      lineDefs.push({
        productId: product.id,
        kind: "BUY",
        quantity: item.quantity,
        unitPriceCents: product.priceCents,
        depositCents: 0,
        name: product.name,
      });
    } else {
      const rent = product.rentPriceCents ?? 0;
      const deposit = product.depositCents ?? 0;
      lineDefs.push({
        productId: product.id,
        kind: "RENT",
        quantity: item.quantity,
        unitPriceCents: rent,
        depositCents: deposit,
        name: `${product.name} (rent ${product.rentalDays} days)`,
      });
    }
  }

  const subtotalCents = lineDefs.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0);
  const depositCents = lineDefs.reduce((s, l) => s + l.depositCents * l.quantity, 0);
  const shippingCents = SHIPPING_CENTS;
  const totalCents = subtotalCents + depositCents + shippingCents;
  const kind = orderKindFromItems(lineDefs.map((l) => l.kind));

  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      status: "PENDING",
      kind,
      shippingAddressId: address.id,
      subtotalCents,
      shippingCents,
      depositCents,
      totalCents,
      items: {
        create: lineDefs.map((l) => ({
          productId: l.productId,
          kind: l.kind,
          quantity: l.quantity,
          unitPriceCents: l.unitPriceCents,
          depositCents: l.depositCents,
        })),
      },
    },
  });

  const origin = process.env.NEXTAUTH_URL || "http://localhost:3000";

  try {
    const stripe = getStripe();
    const stripeLineItems: {
      quantity: number;
      price_data: {
        currency: "usd";
        unit_amount: number;
        product_data: { name: string; description?: string };
      };
    }[] = lineDefs.map((l) => ({
      quantity: l.quantity,
      price_data: {
        currency: "usd",
        unit_amount: l.unitPriceCents + l.depositCents,
        product_data: {
          name: l.name,
          description:
            l.depositCents > 0
              ? `Includes $${(l.depositCents / 100).toFixed(2)} refundable deposit`
              : undefined,
        },
      },
    }));

    stripeLineItems.push({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: shippingCents,
        product_data: { name: "US shipping" },
      },
    });

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: session.user.email ?? undefined,
      line_items: stripeLineItems,
      success_url: `${origin}/orders?success=1&orderId=${order.id}`,
      cancel_url: `${origin}/cart?canceled=1`,
      metadata: { orderId: order.id, userId: session.user.id },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: checkoutSession.id },
    });

    return NextResponse.json({ url: checkoutSession.url, orderId: order.id });
  } catch (err) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });
    console.error("Stripe checkout error", err);
    const message =
      err instanceof Error && err.message.includes("STRIPE_SECRET_KEY")
        ? "Payments are not configured yet. Set STRIPE_SECRET_KEY."
        : "Checkout failed";
    return NextResponse.json({ error: "CHECKOUT_FAILED", message }, { status: 502 });
  }
}
