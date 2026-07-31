"use client";

import Link from "next/link";
import type { Catalog } from "@/lib/catalog/schema";
import { formatCus } from "@/lib/format";
import { matchProgram } from "@/lib/match/engine";
import { useProfile } from "@/lib/profile/use-profile";
import { CourseClearOptions } from "./course-clear-options";
import { CourseTimeNote } from "./course-time-note";
import { ProgramPicker } from "./program-picker";

/** Bare quantity; callers add their own hedging so it never doubles up. */
function formatDays(days: number): string {
  if (days < 14) return `${days} ${days === 1 ? "day" : "days"}`;
  if (days < 60) return `${Math.round(days / 7)} weeks`;
  return `${Math.round(days / 30)} months`;
}

export function PlanView({ catalog }: { catalog: Catalog }) {
  const { profile, hydrated, toggleCompletedCourse } = useProfile();
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
          <section className="panel progress-panel">
            <div className="progress-panel__head">
              <h2>Your progress</h2>
              <strong className="progress-panel__percent">
                {result?.percentComplete ?? 0}%
              </strong>
            </div>
            <div
              className="progress"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={result?.percentComplete ?? 0}
              aria-label="Degree progress"
            >
              <div
                className="progress__fill"
                style={{ width: `${result?.percentComplete ?? 0}%` }}
              />
            </div>
            <p className="muted">
              {formatCus(result?.clearedCus)} of {formatCus(result?.totalCus)} done
              {result && result.clearedCount > 0
                ? ` · ${result.clearedCount} of ${result.courses.length} courses`
                : ""}
            </p>
            {result && result.savedDays > 0 ? (
              <p className="progress-panel__saved">
                <strong>
                  You skip about {formatDays(result.savedDays)} of coursework
                </strong>{" "}
                on the {result.creditedCount}{" "}
                {result.creditedCount === 1 ? "course" : "courses"} your
                credentials and transfer credit cover
                {result.savedWithoutTime > 0
                  ? `, plus ${result.savedWithoutTime} with no reports yet`
                  : ""}
                .
              </p>
            ) : null}

            {result && result.remainingCount > 0 ? (
              result.remainingDays > 0 ? (
                <p className="progress-panel__estimate">
                  Adding up what students reported for each course, the ones you
                  have left come to about {formatDays(result.remainingDays)}
                  {result.remainingWithoutTime > 0
                    ? `, and ${result.remainingWithoutTime} more ${
                        result.remainingWithoutTime === 1 ? "course has" : "courses have"
                      } no reports yet`
                    : ""}
                  . People tend to post when a course went quickly, so treat this
                  as a floor rather than a forecast.
                </p>
              ) : (
                <p className="muted">
                  No student reports yet for the courses you have left.
                </p>
              )
            ) : null}
          </section>

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
            <div className="panel__header">
              <div>
                <h2>Courses</h2>
                <p className="muted">
                  Tick off anything you have finished, at WGU or elsewhere.
                </p>
              </div>
            </div>
            <ul className="course-match-list">
              {result?.courses.map((row) => (
                <li
                  key={row.course.id}
                  className={row.cleared ? "is-cleared" : "is-remaining"}
                >
                  <div className="course-line">
                    <label className="course-done">
                      <input
                        type="checkbox"
                        checked={profile.completedCourseIds.includes(
                          row.course.id,
                        )}
                        onChange={() => toggleCompletedCourse(row.course.id)}
                        aria-label={`Mark ${row.course.code} ${row.course.name} finished`}
                      />
                    </label>
                    <div>
                      <div className="course-row">
                        <span className="course-code">{row.course.code}</span>
                        <span className="course-name">{row.course.name}</span>
                        <span className="course-cu">
                          {formatCus(row.course.cu)}
                        </span>
                        <span className="tag">{row.course.category}</span>
                      </div>
                      {row.cleared ? (
                        <ul className="reason-list">
                          {row.reasons.map((reason, index) => (
                            <li key={index}>
                              {reason.type === "degree"
                                ? `Prior degree (${reason.degree.replace(/_/g, " ")})`
                                : reason.type === "self"
                                  ? "You marked this finished"
                                  : reason.type === "transfer"
                                    ? `${reason.providerName} ${reason.transferCourseName} (${reason.confidence})`
                                    : `${reason.providerName} ${reason.certificateName} (${reason.confidence})`}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <CourseTimeNote time={row.time} />
                      )}
                      <CourseClearOptions
                        catalog={catalog}
                        courseId={row.course.id}
                        programId={program.id}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
