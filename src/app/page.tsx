import Link from "next/link";

const STEPS = [
  { title: "Learn", body: "Free courses and a browser Virtual Lab." },
  { title: "Build", body: "Design circuits and practice with real kit projects." },
  { title: "Buy or Rent", body: "Order hardware kits — keep them or return rentals by mail." },
];

const TECH = ["ESP32", "Arduino", "Sensors", "MQTT", "Virtual Lab", "Starter Kits"];

export default function LandingPage() {
  return (
    <div className="bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <div>
            <span className="text-lg font-semibold tracking-tight text-white">SurpriseSell</span>
            <span className="ml-2 text-xs text-slate-500">Learn. Build. Buy. Rent.</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/shop" className="text-sm text-slate-300 hover:text-white">
              Shop
            </Link>
            <Link href="/login" className="text-sm text-slate-300 hover:text-white">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-brand-500 hover:bg-brand-600 px-4 py-2 text-sm font-medium text-white transition"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white">
          Learn IoT. Build devices. Get kits delivered.
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-400">
          SurpriseSell helps individuals and students learn IoT online, practice in a Virtual Lab,
          then buy or rent real hardware shipped to their door.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-lg bg-brand-500 hover:bg-brand-600 px-6 py-3 text-sm font-medium text-white transition"
          >
            Start learning free
          </Link>
          <Link
            href="/shop"
            className="rounded-lg border border-slate-700 hover:border-slate-500 px-6 py-3 text-sm font-medium text-slate-200 transition"
          >
            Shop kits
          </Link>
          <Link
            href="/shop?mode=rent"
            className="rounded-lg border border-slate-700 hover:border-slate-500 px-6 py-3 text-sm font-medium text-slate-200 transition"
          >
            Rent hardware
          </Link>
        </div>
      </section>

      <section className="border-t border-slate-800 bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-400">How it works</h2>
          <div className="mt-6 grid sm:grid-cols-3 gap-4">
            {STEPS.map((step, i) => (
              <div key={step.title} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <div className="mb-3 h-8 w-8 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-sm font-semibold">
                  {i + 1}
                </div>
                <p className="text-base font-medium text-white">{step.title}</p>
                <p className="mt-1 text-sm text-slate-400">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 grid sm:grid-cols-2 gap-8">
        <div className="rounded-2xl border border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white">Virtual Laboratory</h3>
          <p className="mt-2 text-sm text-slate-400">
            Drag-and-drop ESP32s, sensors, and actuators into a browser circuit builder, write control
            code, and run simulations — no hardware required to start.
          </p>
          <Link href="/signup" className="mt-4 inline-block text-sm text-brand-400 hover:text-brand-300">
            Create a free account →
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white">Kits by mail</h3>
          <p className="mt-2 text-sm text-slate-400">
            Buy starter kits to keep, or rent hardware for a fixed period with a refundable deposit.
            We ship to you; return rentals with tracking when you are done.
          </p>
          <Link href="/shop" className="mt-4 inline-block text-sm text-brand-400 hover:text-brand-300">
            Browse the shop →
          </Link>
        </div>
      </section>

      <section className="border-t border-slate-800 bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-400">
            Supported technologies
          </h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {TECH.map((t) => (
              <span
                key={t}
                className="rounded-full border border-slate-700 px-4 py-1.5 text-sm text-slate-300"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-800">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-white">
            Ready to build your first IoT device?
          </h2>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="inline-block rounded-lg bg-brand-500 hover:bg-brand-600 px-6 py-3 text-sm font-medium text-white transition"
            >
              Sign up free
            </Link>
            <Link
              href="/terms"
              className="inline-block rounded-lg border border-slate-700 px-6 py-3 text-sm font-medium text-slate-300 transition hover:border-slate-500"
            >
              Terms & returns
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800 py-8 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} SurpriseSell. Learn IoT. Build. Buy. Rent.{" "}
        <Link href="/privacy" className="hover:text-slate-400">
          Privacy
        </Link>{" "}
        ·{" "}
        <Link href="/returns" className="hover:text-slate-400">
          Returns
        </Link>
      </footer>
    </div>
  );
}
