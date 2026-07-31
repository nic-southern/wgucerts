"use client";

import Link from "next/link";
import type { Catalog, Program } from "@/lib/catalog/schema";
import { formatCus } from "@/lib/format";
import { matchProgram } from "@/lib/match/engine";
import { useProfile } from "@/lib/profile/use-profile";
import { CourseClearOptions } from "./course-clear-options";

export function ProgramDetail({
  catalog,
  program,
}: {
  catalog: Catalog;
  program: Program;
}) {
  const { profile, hydrated, setSelectedProgramId } = useProfile();
  const courses = program.courseIds
    .map((id) => catalog.courses.find((c) => c.id === id))
    .filter(Boolean);

  const result = hydrated
    ? matchProgram(catalog, profile, program.id)
    : null;

  const listedCus = courses.reduce((sum, c) => sum + (c?.cu ?? 0), 0);
  const totalCus = program.totalCus ?? listedCus;

  return (
    <div className="stack">
      <p className="muted">
        {courses.length} courses · {formatCus(totalCus)} total
        {result ? (
          <>
            {" "}
            · {formatCus(result.clearedCus)} likely cleared ·{" "}
            {formatCus(result.remainingCus)} remaining
          </>
        ) : null}
      </p>

      <div className="actions">
        <button
          type="button"
          className="button"
          onClick={() => setSelectedProgramId(program.id)}
        >
          {profile.selectedProgramId === program.id
            ? "Selected for your plan"
            : "Use in my plan"}
        </button>
        <Link href="/plan" className="button button--ghost">
          View plan
        </Link>
      </div>

      <section className="panel">
        <h2>Your certificates for this program</h2>
        {!hydrated ? (
          <p className="muted">Loading…</p>
        ) : result && result.applicableCertificates.length > 0 ? (
          <ul className="plain-list">
            {result.applicableCertificates.map((item) => (
              <li key={item.certificate.id}>
                <strong>{item.provider.name}</strong> — {item.certificate.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty">
            None of your saved certificates are listed for this program.{" "}
            <Link href="/credentials">Add credentials</Link>
          </p>
        )}
      </section>

      <section className="panel">
        <h2>Courses</h2>
        <p className="muted">
          Expand a course to see certificates and Sophia / Study.com options that
          may clear it.
        </p>
        {courses.length === 0 ? (
          <p className="empty">Course list not available for this program yet.</p>
        ) : (
          <ul className="course-list">
            {courses.map((course) => {
              if (!course) return null;
              const match = result?.courses.find((c) => c.course.id === course.id);
              return (
                <li key={course.id} className="course-item">
                  <div className="course-row">
                    <span className="course-code">{course.code}</span>
                    <span className="course-name">{course.name}</span>
                    <span className="course-cu">{formatCus(course.cu)}</span>
                    <span className="tag">{course.category}</span>
                    {match?.cleared ? (
                      <span className="tag tag--ok">likely cleared</span>
                    ) : null}
                  </div>
                  <CourseClearOptions
                    catalog={catalog}
                    courseId={course.id}
                    programId={program.id}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
