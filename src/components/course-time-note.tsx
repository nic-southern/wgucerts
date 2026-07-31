import type { CourseTime } from "@/lib/catalog/schema";

/** How many source links to show before the list gets noisy. */
const MAX_LINKS = 4;

function dayLabel(days: number): string {
  return `${days} ${days === 1 ? "day" : "days"}`;
}

/**
 * Shows how long students said a course took. The report count is always
 * visible and every number links to its source, because these are individual
 * accounts rather than a measured average.
 */
export function CourseTimeNote({ time }: { time: CourseTime | null }) {
  const reports = time?.reports ?? [];

  if (!time || reports.length === 0) {
    return <p className="time-note time-note--empty">No student reports yet</p>;
  }

  const links = reports.slice(0, MAX_LINKS).map((report) => (
    <a
      key={report.url}
      href={report.url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      title={report.title}
    >
      {report.days ? dayLabel(report.days) : "Read"}
    </a>
  ));

  if (!time.medianDays) {
    return (
      <p className="time-note">
        <span className="muted">No time given ·</span> {links}
      </p>
    );
  }

  const spread =
    time.lowDays && time.highDays && time.lowDays !== time.highDays
      ? `${time.lowDays}–${time.highDays} days reported`
      : null;

  return (
    <p className="time-note">
      <strong>Around {dayLabel(time.medianDays)}</strong>
      <span className="muted">
        {" · "}
        {time.reportCount === 1
          ? "1 student report"
          : `${time.reportCount} student reports`}
        {spread ? ` · ${spread}` : ""}
      </span>
      <span className="time-note__links">{links}</span>
    </p>
  );
}
