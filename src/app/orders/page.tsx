import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatUsd } from "@/lib/stripe";
import { Badge, PageHeader, Card } from "@/components/ui/primitives";
import { redirect } from "next/navigation";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; orderId?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/orders");

  const sp = await searchParams;
  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: { include: { product: true } },
      shippingAddress: true,
    },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <div className="mx-auto max-w-4xl flex items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold text-white">
            SurpriseSell
          </Link>
          <div className="flex gap-4 text-sm">
            <Link href="/rentals" className="text-slate-300 hover:text-white">
              Rentals
            </Link>
            <Link href="/student" className="text-slate-300 hover:text-white">
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10">
        <PageHeader title="Orders" subtitle="Buy and rent purchases after Stripe checkout." />

        {sp.success && (
          <div className="mt-4 rounded-lg border border-emerald-800 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">
            Payment received{sp.orderId ? ` for order ${sp.orderId.slice(0, 8)}…` : ""}. Fulfillment
            starts after the Stripe webhook confirms (or instantly in test once configured).
          </div>
        )}

        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm text-slate-500">
                    {order.createdAt.toLocaleString()} · {order.kind}
                  </p>
                  <p className="font-medium text-white">Order {order.id.slice(0, 10)}…</p>
                </div>
                <Badge
                  tone={
                    order.status === "PAID" || order.status === "SHIPPED" || order.status === "COMPLETED"
                      ? "success"
                      : order.status === "CANCELLED"
                        ? "danger"
                        : "warning"
                  }
                >
                  {order.status}
                </Badge>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-slate-300">
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.product.name} × {item.quantity} ({item.kind}) —{" "}
                    {formatUsd(item.unitPriceCents * item.quantity)}
                    {item.depositCents
                      ? ` + ${formatUsd(item.depositCents * item.quantity)} deposit`
                      : ""}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-white">Total {formatUsd(order.totalCents)}</p>
              {order.shippingAddress && (
                <p className="mt-1 text-xs text-slate-500">
                  Ship to {order.shippingAddress.line1}, {order.shippingAddress.city},{" "}
                  {order.shippingAddress.state} {order.shippingAddress.postalCode}
                </p>
              )}
            </Card>
          ))}
          {orders.length === 0 && (
            <p className="text-slate-400">
              No orders yet.{" "}
              <Link href="/shop" className="text-brand-400">
                Visit the shop
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
