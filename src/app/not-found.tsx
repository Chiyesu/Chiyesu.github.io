import Link from "next/link";

export default function NotFound() {
  return (
    <section className="shell flex min-h-svh flex-col items-start justify-center gap-6">
      <p className="eyebrow">404</p>
      <h1 className="display text-5xl md:text-7xl">This path leads off the map.</h1>
      <Link href="/" className="border-b border-signal pb-1 text-signal">
        Return home
      </Link>
    </section>
  );
}
