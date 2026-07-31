"use client";

import { useState } from "react";
import type { Catalog } from "@/lib/catalog/schema";
import {
  getClearsForCourse,
  hasClearOptions,
} from "@/lib/catalog/course-clears";

const CONFIDENCE_LABEL: Record<"published" | "estimated", string> = {
  published: "WGU transfer guideline",
  estimated: "Course alignment",
};

export function CourseClearOptions({
  catalog,
  courseId,
  programId,
}: {
  catalog: Catalog;
  courseId: string;
  programId: string;
}) {
  const [open, setOpen] = useState(false);
  const options = getClearsForCourse(catalog, courseId, programId);
  if (options.nonTransferable) {
    return (
      <p className="clear-options clear-options--empty">
        Transfer credit isn’t accepted for this course
      </p>
    );
  }
  if (!hasClearOptions(options)) {
    return (
      <p className="clear-options clear-options--empty">
        No transfer options listed yet
      </p>
    );
  }

  const certCount = options.certificates.length;
  const transferCount = options.transferCourses.length;
  const summary = [
    certCount > 0 ? `${certCount} cert${certCount === 1 ? "" : "s"}` : null,
    transferCount > 0
      ? `${transferCount} Sophia/Study.com`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="clear-options">
      <button
        type="button"
        className="clear-options__toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Hide ways to clear" : `Ways to clear · ${summary}`}
      </button>
      {open ? (
        <div className="clear-options__body">
          {certCount > 0 ? (
            <div>
              <h4>Certificates</h4>
              <ul>
                {options.certificates.map((item) => (
                  <li key={item.certificate.id}>
                    <strong>{item.provider.name}</strong> —{" "}
                    {item.certificate.name}
                    <span className="muted"> · {CONFIDENCE_LABEL[item.confidence]}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {transferCount > 0 ? (
            <div>
              <h4>Sophia / Study.com</h4>
              <ul>
                {options.transferCourses.map((item) => (
                  <li key={item.transferCourse.id}>
                    <strong>{item.provider.name}</strong> —{" "}
                    {item.transferCourse.name}
                    {item.transferCourse.externalCode ? (
                      <span className="muted">
                        {" "}
                        ({item.transferCourse.externalCode})
                      </span>
                    ) : null}
                    <span className="muted"> · {CONFIDENCE_LABEL[item.confidence]}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <p className="muted clear-options__note">
            Confirm current articulations with WGU before enrolling elsewhere.
          </p>
        </div>
      ) : null}
    </div>
  );
}
