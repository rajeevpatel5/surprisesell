import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { formatUsd } from "@/lib/stripe";
import { Badge, Card, PageHeader } from "@/components/ui/primitives";
import { FulfillmentActions } from "@/components/admin/fulfillment-actions";

export default async function AdminFulfillmentPage() {
  await requireRole(["PLATFORM_ADMIN", "UNIVERSITY_ADMIN"]);

  const [orders, rentals] = await Promise.all([
    prisma.order.findMany({
      where: { status: { in: ["PAID", "FULFILLING", "SHIPPED"] } },
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
        items: { include: { product: true } },
        shippingAddress: true,
        shipments: true,
      },
      take: 50,
    }),
    prisma.rental.findMany({
      where: { status: { in: ["PAID", "SHIPPED", "DELIVERED", "RETURN_SHIPPED", "RETURNED"] } },
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
        product: true,
        shipments: true,
      },
      take: 50,
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Fulfillment"
        subtitle="Mark outbound shipments with tracking. Confirm returns and release deposits."
      />

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-brand-400">
        Paid orders
      </h2>
      <div className="mt-3 space-y-3">
        {orders.map((order) => (
          <Card key={order.id}>
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-medium text-white">
                  {order.user.firstName} {order.user.lastName} · {order.user.email}
                </p>
                <p className="text-xs text-slate-500">
                  {order.id} · {formatUsd(order.totalCents)} · {order.kind}
                </p>
              </div>
              <Badge tone="warning">{order.status}</Badge>
            </div>
            <ul className="mt-2 text-sm text-slate-300">
              {order.items.map((i) => (
                <li key={i.id}>
                  {i.product.name} × {i.quantity} ({i.kind})
                </li>
              ))}
            </ul>
            {order.shippingAddress && (
              <p className="mt-2 text-xs text-slate-500">
                {order.shippingAddress.line1}, {order.shippingAddress.city},{" "}
                {order.shippingAddress.state} {order.shippingAddress.postalCode}
              </p>
            )}
            <div className="mt-3">
              <FulfillmentActions
                mode="order"
                orderId={order.id}
                showShip={order.status === "PAID" || order.status === "FULFILLING"}
              />
            </div>
          </Card>
        ))}
        {orders.length === 0 && <p className="text-slate-400">No open paid orders.</p>}
      </div>

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-brand-400">
        Rentals
      </h2>
      <div className="mt-3 space-y-3">
        {rentals.map((rental) => (
          <Card key={rental.id}>
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-medium text-white">
                  {rental.product.name} · {rental.user.email}
                </p>
                <p className="text-xs text-slate-500">
                  Due {rental.dueDate?.toLocaleDateString() ?? "—"} · Deposit{" "}
                  {formatUsd(rental.depositCents)}
                </p>
              </div>
              <Badge tone="warning">{rental.status}</Badge>
            </div>
            <div className="mt-3">
              <FulfillmentActions
                mode="rental"
                rentalId={rental.id}
                showShip={rental.status === "PAID"}
                showComplete={rental.status === "RETURN_SHIPPED" || rental.status === "RETURNED"}
              />
            </div>
          </Card>
        ))}
        {rentals.length === 0 && <p className="text-slate-400">No open rentals.</p>}
      </div>
    </div>
  );
}
