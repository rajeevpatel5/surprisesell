import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatUsd } from "@/lib/stripe";
import { Badge, Card, PageHeader } from "@/components/ui/primitives";
import { redirect } from "next/navigation";
import { MarkReturnButton } from "@/components/shop/mark-return-button";

export default async function RentalsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/rentals");

  const rentals = await prisma.rental.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      product: true,
      shipments: { orderBy: { createdAt: "desc" } },
    },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <div className="mx-auto max-w-4xl flex items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold text-white">
            SurpriseSell
          </Link>
          <Link href="/orders" className="text-sm text-slate-300 hover:text-white">
            Orders
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10">
        <PageHeader
          title="Mail rentals"
          subtitle="Track shipments, due dates, and return kits when your rental period ends."
        />

        <div className="mt-8 space-y-4">
          {rentals.map((rental) => (
            <Card key={rental.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{rental.product.name}</p>
                  <p className="text-sm text-slate-400">
                    Due {rental.dueDate ? rental.dueDate.toLocaleDateString() : "—"} · Deposit{" "}
                    {formatUsd(rental.depositCents)}
                    {rental.depositReleased ? " (released)" : ""}
                  </p>
                </div>
                <Badge
                  tone={
                    rental.status === "COMPLETED" || rental.status === "RETURNED"
                      ? "success"
                      : rental.status === "OVERDUE"
                        ? "danger"
                        : "warning"
                  }
                >
                  {rental.status}
                </Badge>
              </div>

              {rental.shipments.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs text-slate-500">
                  {rental.shipments.map((s) => (
                    <li key={s.id}>
                      {s.direction}: {s.carrier} {s.trackingNumber}
                    </li>
                  ))}
                </ul>
              )}

              {["PAID", "SHIPPED", "DELIVERED"].includes(rental.status) && (
                <div className="mt-4">
                  <MarkReturnButton rentalId={rental.id} />
                  <p className="mt-2 text-xs text-slate-500">
                    Pack the kit, drop it off with a carrier, then mark return shipped. We release your
                    deposit after we confirm receipt.
                  </p>
                </div>
              )}
            </Card>
          ))}
          {rentals.length === 0 && (
            <p className="text-slate-400">
              No rentals yet.{" "}
              <Link href="/shop?mode=rent" className="text-brand-400">
                Rent a kit
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
