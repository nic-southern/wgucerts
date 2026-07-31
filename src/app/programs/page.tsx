import Link from "next/link";
import { getBachelorPrograms, getCatalog } from "@/lib/catalog/load";
import { formatCus } from "@/lib/format";

export default function ProgramsPage() {
  const catalog = getCatalog();
  const programs = getBachelorPrograms();

  return (
    <>
      <h1 className="page-title">Programs</h1>
      <p className="lede">
        WGU School of Technology bachelor’s programs with transferable
        certification listings. Competency units (CUs) are WGU’s credit-hour
        equivalent.
      </p>
      <div className="program-grid">
        {programs.map((program) => {
          const listedCus = program.courseIds.reduce((sum, id) => {
            const course = catalog.courses.find((c) => c.id === id);
            return sum + (course?.cu ?? 0);
          }, 0);
          const totalCus = program.totalCus ?? listedCus;
          return (
            <Link
              key={program.id}
              href={`/programs/${program.slug}`}
              className="program-link"
            >
              <strong>{program.name}</strong>
              <div className="muted">
                {program.courseIds.length} courses · {formatCus(totalCus)}
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
