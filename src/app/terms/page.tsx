import Link from "next/link";

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service">
      <p>
        SurpriseSell provides online IoT learning tools and sells or rents hardware kits. By creating
        an account or placing an order you agree to these terms.
      </p>
      <h2 className="text-white font-medium mt-6">Learning platform</h2>
      <p>
        Virtual Lab simulations and course content are provided as educational tools. Code “Run”
        actions evaluate simulation rules and do not compile arbitrary firmware on our servers.
      </p>
      <h2 className="text-white font-medium mt-6">Purchases & rentals</h2>
      <p>
        Kit purchases transfer ownership after successful payment and delivery. Rentals remain
        SurpriseSell property. A refundable deposit may be charged and released after timely return
        of undamaged equipment.
      </p>
      <h2 className="text-white font-medium mt-6">Shipping</h2>
      <p>
        v1 ships within the United States with a flat shipping fee shown at checkout. Delivery times
        depend on the carrier once a tracking number is provided.
      </p>
    </LegalShell>
  );
}

function LegalShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      <header className="border-b border-slate-800 px-6 py-4">
        <Link href="/" className="text-white font-semibold">
          SurpriseSell
        </Link>
      </header>
      <article className="mx-auto max-w-2xl px-6 py-10 prose prose-invert prose-sm">
        <h1 className="text-2xl font-semibold text-white mb-4">{title}</h1>
        <div className="space-y-3 text-sm leading-relaxed">{children}</div>
      </article>
    </div>
  );
}
