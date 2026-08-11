import Link from "next/link";

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      <header className="border-b border-slate-800 px-6 py-4">
        <Link href="/" className="text-white font-semibold">
          SurpriseSell
        </Link>
      </header>
      <article className="mx-auto max-w-2xl px-6 py-10 space-y-4 text-sm leading-relaxed">
        <h1 className="text-2xl font-semibold text-white">Returns & rentals</h1>
        <p>
          <strong className="text-white">Buy orders:</strong> Contact support within 14 days of
          delivery for defective items. Opened consumable kits may be ineligible for return.
        </p>
        <p>
          <strong className="text-white">Rentals:</strong> Return kits by the due date shown in your
          Rentals dashboard. Use “Mark return shipped” after you drop the package with a carrier.
          Deposits are released after we confirm the return in good condition.
        </p>
        <p>
          Late or damaged returns may forfeit some or all of the deposit. See{" "}
          <Link href="/terms" className="text-brand-400">
            Terms
          </Link>
          .
        </p>
      </article>
    </div>
  );
}
