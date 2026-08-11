import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatUsd } from "@/lib/stripe";
import { PageHeader, Card, Badge } from "@/components/ui/primitives";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  const preferRent = mode === "rent";

  const products = await prisma.product.findMany({
    where: {
      active: true,
      ...(preferRent
        ? { OR: [{ type: "RENTABLE" }, { type: "BOTH" }] }
        : {}),
    },
    orderBy: { name: "asc" },
    include: { course: true },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold text-white">
            SurpriseSell
          </Link>
          <div className="flex gap-4 text-sm">
            <Link href="/shop" className="text-slate-300 hover:text-white">
              All kits
            </Link>
            <Link href="/shop?mode=rent" className="text-slate-300 hover:text-white">
              Rentals
            </Link>
            <Link href="/cart" className="text-slate-300 hover:text-white">
              Cart
            </Link>
            <Link href="/signup" className="text-brand-400 hover:text-brand-300">
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <PageHeader
          title={preferRent ? "Rent IoT kits by mail" : "Shop IoT kits"}
          subtitle={
            preferRent
              ? "Pay a rental fee plus refundable deposit. We ship to you — return when your period ends."
              : "Buy kits to keep, or rent with a refundable deposit. Pair each kit with free online courses."
          }
        />

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((p) => (
            <Card key={p.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-semibold text-white">{p.name}</h3>
                <Badge tone={p.stock > 0 ? "success" : "danger"}>
                  {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-slate-400 line-clamp-3">{p.description}</p>
              <div className="mt-4 space-y-1 text-sm">
                {(p.type === "BUYABLE" || p.type === "BOTH") && (
                  <p className="text-white">Buy {formatUsd(p.priceCents)}</p>
                )}
                {(p.type === "RENTABLE" || p.type === "BOTH") && (
                  <p className="text-slate-300">
                    Rent {formatUsd(p.rentPriceCents ?? 0)} / {p.rentalDays} days
                    {p.depositCents ? ` + ${formatUsd(p.depositCents)} deposit` : ""}
                  </p>
                )}
              </div>
              {p.course && (
                <p className="mt-3 text-xs text-brand-400">Pairs with: {p.course.name}</p>
              )}
              <Link
                href={`/shop/${p.slug}`}
                className="mt-auto pt-4 text-sm font-medium text-brand-400 hover:text-brand-300"
              >
                View details →
              </Link>
            </Card>
          ))}
        </div>

        {products.length === 0 && (
          <p className="mt-8 text-slate-400">No products yet. Seed the catalog to populate the shop.</p>
        )}
      </div>
    </div>
  );
}
