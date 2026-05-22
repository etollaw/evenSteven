import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <p className="text-sm uppercase tracking-widest text-[color:var(--muted-foreground)]">404</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Couldn&apos;t find that</h1>
        <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
          The page you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.
        </p>
        <Link href="/dashboard" className="btn btn-primary mt-6">Go to dashboard</Link>
      </div>
    </main>
  );
}
