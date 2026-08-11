"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CartItem,
  cartTotals,
  clearCart,
  readCart,
  removeFromCart,
} from "@/lib/cart";
import { formatUsd } from "@/lib/money";
import { SHIPPING_CENTS } from "@/lib/tenant";

type Address = {
  id: string;
  label: string | null;
  line1: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
};

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authNeeded, setAuthNeeded] = useState(false);

  function refresh() {
    setItems(readCart());
  }

  useEffect(() => {
    refresh();
    const onCart = () => refresh();
    window.addEventListener("surprisesell-cart", onCart);
    return () => window.removeEventListener("surprisesell-cart", onCart);
  }, []);

  useEffect(() => {
    fetch("/api/addresses")
      .then(async (res) => {
        if (res.status === 401) {
          setAuthNeeded(true);
          return;
        }
        const data = await res.json();
        const list = (data.addresses ?? []) as Address[];
        setAddresses(list);
        const def = list.find((a) => a.isDefault) ?? list[0];
        if (def) setAddressId(def.id);
      })
      .catch(() => setAuthNeeded(true));
  }, []);

  const { subtotalCents, depositCents } = cartTotals(items);
  const totalCents = subtotalCents + depositCents + (items.length ? SHIPPING_CENTS : 0);

  async function checkout() {
    setError(null);
    if (authNeeded) {
      window.location.href = `/login?callbackUrl=${encodeURIComponent("/cart")}`;
      return;
    }
    if (!addressId) {
      setError("Add a shipping address before checkout.");
      return;
    }
    if (!items.length) {
      setError("Your cart is empty.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        addressId,
        items: items.map((i) => ({
          productId: i.productId,
          kind: i.kind,
          quantity: i.quantity,
        })),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.message || data.error || "Checkout failed");
      return;
    }
    clearCart();
    if (data.url) {
      window.location.href = data.url;
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <div className="mx-auto max-w-3xl flex items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold text-white">
            SurpriseSell
          </Link>
          <Link href="/shop" className="text-sm text-slate-300 hover:text-white">
            Continue shopping
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-white">Cart</h1>

        {items.length === 0 ? (
          <p className="mt-6 text-slate-400">
            Your cart is empty.{" "}
            <Link href="/shop" className="text-brand-400">
              Browse kits
            </Link>
          </p>
        ) : (
          <ul className="mt-6 space-y-3">
            {items.map((item) => (
              <li
                key={`${item.productId}-${item.kind}`}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex justify-between gap-4"
              >
                <div>
                  <p className="font-medium text-white">
                    {item.name}{" "}
                    <span className="text-xs text-slate-500">({item.kind})</span>
                  </p>
                  <p className="text-sm text-slate-400">
                    Qty {item.quantity} · {formatUsd(item.unitPriceCents)}
                    {item.depositCents > 0
                      ? ` + ${formatUsd(item.depositCents)} deposit`
                      : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    removeFromCart(item.productId, item.kind);
                    refresh();
                  }}
                  className="text-sm text-slate-500 hover:text-red-400"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8 rounded-xl border border-slate-800 p-5 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Subtotal</span>
            <span>{formatUsd(subtotalCents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Deposits</span>
            <span>{formatUsd(depositCents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Shipping (US)</span>
            <span>{items.length ? formatUsd(SHIPPING_CENTS) : formatUsd(0)}</span>
          </div>
          <div className="flex justify-between text-base font-medium text-white pt-2 border-t border-slate-800">
            <span>Total</span>
            <span>{formatUsd(totalCents)}</span>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm text-slate-300 mb-1">Shipping address</label>
          {authNeeded ? (
            <p className="text-sm text-amber-400">
              <Link href={`/login?callbackUrl=${encodeURIComponent("/cart")}`} className="underline">
                Sign in
              </Link>{" "}
              to choose an address and checkout.
            </p>
          ) : addresses.length === 0 ? (
            <p className="text-sm text-slate-400">
              No addresses yet.{" "}
              <Link href="/account/addresses" className="text-brand-400">
                Add one
              </Link>
            </p>
          ) : (
            <select
              value={addressId}
              onChange={(e) => setAddressId(e.target.value)}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white"
            >
              {addresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label ? `${a.label} — ` : ""}
                  {a.line1}, {a.city}, {a.state} {a.postalCode}
                </option>
              ))}
            </select>
          )}
        </div>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <button
          type="button"
          disabled={loading || items.length === 0}
          onClick={checkout}
          className="mt-6 w-full rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 py-3 text-sm font-medium text-white"
        >
          {loading ? "Redirecting to Stripe…" : "Checkout with Stripe"}
        </button>
      </div>
    </div>
  );
}
