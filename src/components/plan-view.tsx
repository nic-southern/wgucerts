"use client";

import Link from "next/link";
import type { Catalog } from "@/lib/catalog/schema";
import { formatCus } from "@/lib/format";
import { matchProgram } from "@/lib/match/engine";
import { useProfile } from "@/lib/profile/use-profile";
import { CourseClearOptions } from "./course-clear-options";
import { ProgramPicker } from "./program-picker";

export function PlanView({ catalog }: { catalog: Catalog }) {
  const { profile, hydrated } = useProfile();
  const programs = catalog.programs.filter((p) => p.degreeLevel === "bachelors");
  const programId = profile.selectedProgramId;
  const program = programs.find((p) => p.id === programId) ?? null;
  const result =
    program && hydrated
      ? matchProgram(catalog, profile, program.id)
      : null;

  return (
    <div className="stack">
      <ProgramPicker
        programs={programs.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
        }))}
      />

      {!hydrated ? (
        <p className="muted">Loading your saved credentials…</p>
      ) : !program ? (
        <p className="empty">
          Select a program to see what your credentials may apply to.{" "}
          <Link href="/programs">Browse programs</Link>
        </p>
      ) : (
        <>
          <div className="stat-row">
            <div>
              <strong>{result?.clearedCount ?? 0}</strong>
              <span>courses cleared</span>
              <span className="stat-sub">{formatCus(result?.clearedCus)}</span>
            </div>
            <div>
              <strong>{result?.remainingCount ?? 0}</strong>
              <span>courses remaining</span>
              <span className="stat-sub">{formatCus(result?.remainingCus)}</span>
            </div>
            <div>
              <strong>{formatCus(result?.totalCus)}</strong>
              <span>program total</span>
              <span className="stat-sub">
                {result?.applicableCertificates.length ?? 0} applicable certs
              </span>
            </div>
          </div>

          {result?.degreeNotes ? (
            <p className="callout">{result.degreeNotes}</p>
          ) : null}

          <section className="panel">
            <h2>Applicable certificates</h2>
            {result && result.applicableCertificates.length === 0 ? (
              <p className="empty">
                No selected certificates are listed for this program yet.{" "}
                <Link href="/credentials">Add credentials</Link>
              </p>
            ) : (
              <ul className="plain-list">
                {result?.applicableCertificates.map((item) => (
                  <li key={item.certificate.id}>
                    <strong>{item.provider.name}</strong> —{" "}
                    {item.certificate.name}
                    {item.clearsCourses.length > 0 ? (
                      <span className="muted">
                        {" "}
                        · may clear{" "}
                        {item.clearsCourses
                          .map((c) => `${c.code} (${formatCus(c.cu)})`)
                          .join(", ")}
                      </span>
                    ) : (
                      <span className="muted">
                        {" "}
                        · listed as transferable into this program
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {result && result.ineligibleCertificates.length > 0 ? (
            <section className="panel">
              <h2>Selected but not listed for this program</h2>
              <ul className="plain-list">
                {result.ineligibleCertificates.map((item) => (
                  <li key={item.certificate.id}>
                    {item.provider.name} — {item.certificate.name}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="panel">
            <h2>Courses</h2>
            <ul className="course-match-list">
              {result?.courses.map((row) => (
                <li
                  key={row.course.id}
                  className={row.cleared ? "is-cleared" : "is-remaining"}
                >
                  <div className="course-row">
                    <span className="course-code">{row.course.code}</span>
                    <span className="course-name">{row.course.name}</span>
                    <span className="course-cu">{formatCus(row.course.cu)}</span>
                    <span className="tag">{row.course.category}</span>
                  </div>
                  {row.cleared ? (
                    <ul className="reason-list">
                      {row.reasons.map((reason, index) => (
                        <li key={index}>
                          {reason.type === "degree"
                            ? `Prior degree (${reason.degree.replace(/_/g, " ")})`
                            : `${reason.providerName} ${reason.certificateName} (${reason.confidence})`}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="muted">Still needed</span>
                  )}
                  <CourseClearOptions
                    catalog={catalog}
                    courseId={row.course.id}
                    programId={program.id}
                  />
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
