import { notFound } from "next/navigation";
import { ProgramDetail } from "@/components/program-detail";
import { getBachelorPrograms, getCatalog, getProgramBySlug } from "@/lib/catalog/load";

export function generateStaticParams() {
  return getBachelorPrograms().map((program) => ({ slug: program.slug }));
}

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const program = getProgramBySlug(slug);
  if (!program) notFound();
  const catalog = getCatalog();

  return (
    <>
      <h1 className="page-title">{program.name}</h1>
      <p className="lede">
        Course list and how your saved credentials may apply. Confirm everything
        with WGU.
      </p>
      <ProgramDetail catalog={catalog} program={program} />
    </>
  );
}
