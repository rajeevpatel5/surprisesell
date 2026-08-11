"use client";

import { useState } from "react";
import Link from "next/link";
import { addToCart } from "@/lib/cart";

type Props = {
  product: {
    id: string;
    slug: string;
    name: string;
    priceCents: number;
    rentPriceCents: number | null;
    depositCents: number | null;
    stock: number;
    canBuy: boolean;
    canRent: boolean;
  };
};

export function AddToCartButtons({ product }: Props) {
  const [msg, setMsg] = useState<string | null>(null);
  const disabled = product.stock <= 0;

  function add(kind: "BUY" | "RENT") {
    addToCart({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      kind,
      quantity: 1,
      unitPriceCents: kind === "BUY" ? product.priceCents : product.rentPriceCents ?? 0,
      depositCents: kind === "RENT" ? product.depositCents ?? 0 : 0,
    });
    setMsg(kind === "BUY" ? "Added buy item to cart." : "Added rental to cart.");
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {product.canBuy && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => add("BUY")}
            className="rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 px-5 py-2.5 text-sm font-medium text-white"
          >
            Add buy to cart
          </button>
        )}
        {product.canRent && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => add("RENT")}
            className="rounded-lg border border-slate-600 hover:border-slate-400 disabled:opacity-50 px-5 py-2.5 text-sm font-medium text-slate-100"
          >
            Add rental to cart
          </button>
        )}
        <Link
          href="/cart"
          className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm text-slate-300 hover:text-white"
        >
          View cart
        </Link>
      </div>
      {msg && <p className="text-sm text-signal-400">{msg}</p>}
    </div>
  );
}
