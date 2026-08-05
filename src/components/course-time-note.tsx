import type { CourseTime, CourseTimeReport } from "@/lib/catalog/schema";

/** How many reports to list before it crowds out the course itself. */
const MAX_REPORTS = 4;

function dayLabel(days: number): string {
  return `${days} ${days === 1 ? "day" : "days"}`;
}

/**
 * Month and year: the day a post went up is not the day its author finished, so
 * a precise date would claim more than we know.
 */
function monthLabel(postedAt: string): string {
  const [year, month] = postedAt.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function ReportLine({ report }: { report: CourseTimeReport }) {
  return (
    <li>
      <a
        href={report.url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        title={report.title}
      >
        {report.days ? dayLabel(report.days) : "Read"}
      </a>
      {report.postedAt ? (
        <span className="muted"> {monthLabel(report.postedAt)}</span>
      ) : null}
    </li>
  );
}

/**
 * Shows how long students said a course took. The report count is always
 * visible and every account links to its source, because these are individual
 * accounts rather than a measured average.
 *
 * The list stays up for a course already finished: the accounts are still worth
 * reading, and hiding them loses the only record of where a time came from.
 */
export function CourseTimeNote({
  time,
  showEmpty = true,
}: {
  time: CourseTime | null;
  showEmpty?: boolean;
}) {
  const reports = time?.reports ?? [];

  if (!time || reports.length === 0) {
    if (!showEmpty) return null;
    return <p className="time-note time-note--empty">No student reports yet</p>;
  }

  const shown = reports.slice(0, MAX_REPORTS);
  const list = (
    <ul className="time-note__reports">
      {shown.map((report) => (
        <ReportLine key={report.url} report={report} />
      ))}
    </ul>
  );

  if (!time.medianDays) {
    return (
      <div className="time-note">
        <p className="muted">No time given</p>
        {list}
      </div>
    );
  }

  const spread =
    time.lowDays && time.highDays && time.lowDays !== time.highDays
      ? `${time.lowDays}–${time.highDays} days reported`
      : null;

  return (
    <div className="time-note">
      <p>
        <strong>Around {dayLabel(time.medianDays)}</strong>
        <span className="muted">
          {" · "}
          {time.reportCount === 1
            ? "1 student report"
            : `${time.reportCount} student reports`}
          {spread ? ` · ${spread}` : ""}
        </span>
      </p>
      {list}
    </div>
  );
}
