import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatUsd } from "@/lib/stripe";
import { AddToCartButtons } from "@/components/shop/add-to-cart-buttons";
import { Badge } from "@/components/ui/primitives";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { course: true },
  });
  if (!product || !product.active) notFound();

  const canBuy = product.type === "BUYABLE" || product.type === "BOTH";
  const canRent = product.type === "RENTABLE" || product.type === "BOTH";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold text-white">
            SurpriseSell
          </Link>
          <Link href="/shop" className="text-sm text-slate-300 hover:text-white">
            ← Back to shop
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-semibold text-white">{product.name}</h1>
          <Badge tone={product.stock > 0 ? "success" : "danger"}>
            {product.stock > 0 ? "In stock" : "Out of stock"}
          </Badge>
        </div>
        <p className="mt-4 text-slate-300 leading-relaxed">{product.description}</p>

        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
          {canBuy && (
            <p className="text-lg text-white">
              Buy: <span className="font-semibold">{formatUsd(product.priceCents)}</span>
            </p>
          )}
          {canRent && (
            <p className="text-lg text-slate-200">
              Rent: <span className="font-semibold">{formatUsd(product.rentPriceCents ?? 0)}</span> for{" "}
              {product.rentalDays} days
              {product.depositCents
                ? ` + ${formatUsd(product.depositCents)} refundable deposit`
                : ""}
            </p>
          )}
          <p className="text-xs text-slate-500">US flat shipping added at checkout.</p>
        </div>

        {product.course && (
          <div className="mt-6 rounded-xl border border-brand-500/30 bg-brand-500/5 p-4">
            <p className="text-sm text-brand-300 font-medium">Learn with this kit</p>
            <p className="mt-1 text-sm text-slate-300">
              Recommended course: {product.course.name}. Sign in to open the Virtual Lab and
              assignments after purchase or rental.
            </p>
            <Link
              href="/student/courses"
              className="mt-2 inline-block text-sm text-brand-400 hover:text-brand-300"
            >
              Go to courses →
            </Link>
          </div>
        )}

        <div className="mt-8">
          <AddToCartButtons
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              priceCents: product.priceCents,
              rentPriceCents: product.rentPriceCents,
              depositCents: product.depositCents,
              stock: product.stock,
              canBuy,
              canRent,
            }}
          />
        </div>
      </div>
    </div>
  );
}
