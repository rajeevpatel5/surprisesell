"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function FulfillmentActions({
  mode,
  orderId,
  rentalId,
  showShip,
  showComplete,
}: {
  mode: "order" | "rental";
  orderId?: string;
  rentalId?: string;
  showShip?: boolean;
  showComplete?: boolean;
}) {
  const router = useRouter();
  const [carrier, setCarrier] = useState("USPS");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function ship() {
    setLoading(true);
    setMsg(null);
    const res = await fetch("/api/admin/shipments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: mode === "order" ? orderId : undefined,
        rentalId,
        direction: "OUTBOUND",
        carrier,
        trackingNumber,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      setMsg("Ship failed");
      return;
    }
    setTrackingNumber("");
    router.refresh();
  }

  async function completeReturn() {
    if (!rentalId) return;
    setLoading(true);
    setMsg(null);
    const res = await fetch("/api/admin/rentals/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rentalId, releaseDeposit: true }),
    });
    setLoading(false);
    if (!res.ok) {
      setMsg("Complete failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-2">
      {showShip && (
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Carrier</label>
            <input
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className="rounded-lg bg-slate-950 border border-slate-700 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Tracking</label>
            <input
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="rounded-lg bg-slate-950 border border-slate-700 px-2 py-1.5 text-sm min-w-[180px]"
              placeholder="Tracking #"
            />
          </div>
          <button
            type="button"
            disabled={loading || !trackingNumber}
            onClick={ship}
            className="rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 px-3 py-1.5 text-sm text-white"
          >
            Mark shipped
          </button>
        </div>
      )}
      {showComplete && (
        <button
          type="button"
          disabled={loading}
          onClick={completeReturn}
          className="rounded-lg border border-emerald-700 text-emerald-300 px-3 py-1.5 text-sm hover:bg-emerald-950/40 disabled:opacity-50"
        >
          Confirm return & release deposit
        </button>
      )}
      {msg && <p className="text-xs text-red-400">{msg}</p>}
    </div>
  );
}
