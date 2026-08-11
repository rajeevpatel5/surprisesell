import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      <header className="border-b border-slate-800 px-6 py-4">
        <Link href="/" className="text-white font-semibold">
          SurpriseSell
        </Link>
      </header>
      <article className="mx-auto max-w-2xl px-6 py-10 space-y-4 text-sm leading-relaxed">
        <h1 className="text-2xl font-semibold text-white">Privacy</h1>
        <p>
          We collect account details (name, email), shipping addresses for fulfillment, and payment
          metadata via Stripe (we do not store full card numbers).
        </p>
        <p>
          Data is used to operate courses, Virtual Lab access, orders, and rentals. Contact us to
          request account deletion subject to legal retention for completed transactions.
        </p>
      </article>
    </div>
  );
}
