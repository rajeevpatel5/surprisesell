"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MarkReturnButton({ rentalId }: { rentalId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function mark() {
    setLoading(true);
    await fetch(`/api/rentals/${rentalId}/return`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={mark}
      className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:border-slate-400 disabled:opacity-50"
    >
      {loading ? "Updating…" : "Mark return shipped"}
    </button>
  );
}
