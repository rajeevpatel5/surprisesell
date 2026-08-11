import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatUsd } from "@/lib/stripe";
import { requireRole } from "@/lib/auth";
import { Badge, Card, PageHeader } from "@/components/ui/primitives";

export default async function AdminProductsPage() {
  await requireRole(["PLATFORM_ADMIN", "UNIVERSITY_ADMIN"]);
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    include: { course: true },
  });

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Catalog for buy and mail-rent kits. Edit stock via database/seed for v1."
      />
      <div className="mt-6 space-y-3">
        {products.map((p) => (
          <Card key={p.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-white">{p.name}</p>
                <p className="text-xs text-slate-500">/{p.slug}</p>
                <p className="mt-2 text-sm text-slate-400 line-clamp-2">{p.description}</p>
              </div>
              <Badge tone={p.active ? "success" : "danger"}>{p.active ? "Active" : "Off"}</Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-300">
              <span>Type {p.type}</span>
              <span>Buy {formatUsd(p.priceCents)}</span>
              <span>Rent {formatUsd(p.rentPriceCents ?? 0)}</span>
              <span>Deposit {formatUsd(p.depositCents ?? 0)}</span>
              <span>Stock {p.stock}</span>
              {p.course && <span>Course: {p.course.name}</span>}
            </div>
            <Link href={`/shop/${p.slug}`} className="mt-3 inline-block text-sm text-brand-400">
              View storefront →
            </Link>
          </Card>
        ))}
        {products.length === 0 && <p className="text-slate-400">No products. Run the seed.</p>}
      </div>
    </div>
  );
}
