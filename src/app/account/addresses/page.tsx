"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Address = {
  id: string;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    label: "Home",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
    isDefault: true,
  });

  async function load() {
    const res = await fetch("/api/addresses");
    if (!res.ok) {
      setError("Could not load addresses. Sign in and try again.");
      return;
    }
    const data = await res.json();
    setAddresses(data.addresses ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        line2: form.line2 || undefined,
      }),
    });
    if (!res.ok) {
      setError("Could not save address.");
      return;
    }
    setForm((f) => ({ ...f, line1: "", line2: "", city: "", state: "", postalCode: "" }));
    await load();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <div className="mx-auto max-w-2xl flex items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold text-white">
            SurpriseSell
          </Link>
          <Link href="/cart" className="text-sm text-slate-300 hover:text-white">
            Cart
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-white">Shipping addresses</h1>
        <p className="mt-1 text-sm text-slate-400">Required for kit buy and mail rental checkout.</p>

        <ul className="mt-6 space-y-3">
          {addresses.map((a) => (
            <li key={a.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm">
              <p className="font-medium text-white">
                {a.label || "Address"} {a.isDefault ? "(default)" : ""}
              </p>
              <p className="text-slate-400">
                {a.line1}
                {a.line2 ? `, ${a.line2}` : ""}
              </p>
              <p className="text-slate-400">
                {a.city}, {a.state} {a.postalCode}, {a.country}
              </p>
            </li>
          ))}
        </ul>

        <form onSubmit={submit} className="mt-8 space-y-3 rounded-xl border border-slate-800 p-5">
          <h2 className="text-sm font-semibold text-white">Add address</h2>
          {(
            [
              ["label", "Label"],
              ["line1", "Address line 1"],
              ["line2", "Address line 2"],
              ["city", "City"],
              ["state", "State"],
              ["postalCode", "Postal code"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className="block text-xs text-slate-400 mb-1">{label}</label>
              <input
                required={key !== "line2" && key !== "label"}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white"
              />
            </div>
          ))}
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
            />
            Set as default
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            className="rounded-lg bg-brand-500 hover:bg-brand-600 px-4 py-2 text-sm font-medium text-white"
          >
            Save address
          </button>
        </form>
      </div>
    </div>
  );
}
