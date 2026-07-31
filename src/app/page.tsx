import Link from "next/link";
import { Disclaimer } from "@/components/disclaimer";
import { ProgramPicker } from "@/components/program-picker";
import { getBachelorPrograms, getCatalog } from "@/lib/catalog/load";

export default function HomePage() {
  const catalog = getCatalog();
  const programs = getBachelorPrograms();

  return (
    <>
      <section className="hero">
        <h1>WGU Certs</h1>
        <p>
          Browse School of Technology programs, add the certificates and degrees
          you already hold, and see what may transfer toward your path.
        </p>
        <div className="actions">
          <Link href="/programs" className="button">
            Browse programs
          </Link>
          <Link href="/credentials" className="button button--ghost">
            Add credentials
          </Link>
        </div>
      </section>

      <Disclaimer />

      <section className="panel">
        <h2>Start with a program</h2>
        <p className="muted">
          Your choice is saved in this browser only.
        </p>
        <ProgramPicker
          programs={programs.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
          }))}
        />
        <p className="muted">
          Then open <Link href="/plan">My plan</Link> to see cleared and remaining
          courses.
        </p>
      </section>

      <p className="meta">
        Catalog refreshed {new Date(catalog.meta.fetchedAt).toLocaleDateString()}{" "}
        from WGU public pages. {programs.length} bachelor’s programs ·{" "}
        {catalog.certificates.length} certificates.
      </p>
    </>
  );
}
