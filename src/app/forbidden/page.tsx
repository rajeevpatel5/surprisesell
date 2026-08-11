import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-center px-4">
      <div>
        <h1 className="text-3xl font-semibold text-white">403 — Not authorized</h1>
        <p className="mt-2 text-slate-400">Your account role doesn't have access to this area.</p>
        <Link href="/redirect" className="mt-6 inline-block text-brand-400 hover:text-brand-300">
          Go to my dashboard →
        </Link>
      </div>
    </div>
  );
}
