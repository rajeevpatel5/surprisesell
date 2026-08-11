import { prisma } from "@/lib/prisma";
import type { OrderItemKind, Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

export async function fulfillPaidOrder(orderId: string, paymentIntentId?: string | null) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
    });
    if (!order) throw new Error("ORDER_NOT_FOUND");
    if (order.status === "PAID" || order.status === "FULFILLING" || order.status === "SHIPPED" || order.status === "COMPLETED") {
      return order;
    }

    for (const item of order.items) {
      if (item.product.stock < item.quantity) {
        throw new Error(`INSUFFICIENT_STOCK:${item.product.slug}`);
      }
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });

      if (item.kind === "RENT") {
        const days = item.product.rentalDays || 14;
        const start = new Date();
        const due = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
        await tx.rental.create({
          data: {
            orderItemId: item.id,
            userId: order.userId,
            productId: item.productId,
            status: "PAID",
            startDate: start,
            dueDate: due,
            depositCents: item.depositCents,
          },
        });
      }
    }

    return tx.order.update({
      where: { id: orderId },
      data: {
        status: "PAID",
        stripePaymentIntentId: paymentIntentId ?? order.stripePaymentIntentId,
      },
    });
  });
}

export function orderKindFromItems(kinds: OrderItemKind[]) {
  const unique = new Set(kinds);
  if (unique.size === 1) return unique.has("BUY") ? ("BUY" as const) : ("RENT" as const);
  return "MIXED" as const;
}

export async function releaseRentalDeposit(tx: Tx, rentalId: string) {
  const rental = await tx.rental.findUnique({ where: { id: rentalId } });
  if (!rental || rental.depositReleased) return rental;
  return tx.rental.update({
    where: { id: rentalId },
    data: {
      depositReleased: true,
      status: "COMPLETED",
      returnedAt: rental.returnedAt ?? new Date(),
    },
  });
}
