import type { CourseTime, CourseTimeReport } from "../../src/lib/catalog/schema";
import { courseCodesInText } from "./parse-duration";
import type { CourseTimeSeed } from "./course-time-seed";

export type CourseRef = {
  id: string;
  code: string;
  name: string;
};

/** A report gathered by searching, before it is tied to a catalog course. */
export type ScrapedReport = {
  code: string;
  url: string;
  title: string;
  days?: number;
};

export type CourseTimeWarning =
  /** The cited post is about a different course, so the time is not this course's. */
  | { kind: "miscited"; code: string; url: string; cited: string[] }
  /** The curated row names a course the catalog does not have. */
  | { kind: "unknownCourse"; code: string }
  /** The curated name drifted from the catalog name; one of them is stale. */
  | { kind: "nameMismatch"; code: string; seedName: string; catalogName: string };

export type BuildCourseTimesResult = {
  courseTimes: CourseTime[];
  warnings: CourseTimeWarning[];
};

/** "d326_advanced_data_management_passed" → "D326 advanced data management passed" */
function titleFromUrl(url: string): string {
  const slug = url.replace(/\/$/, "").split("/").pop() ?? url;
  const words = slug.replace(/_/g, " ").trim();
  if (!words) return url;
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function comparableName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const raw =
    sorted.length % 2 === 1
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  return Math.max(1, Math.round(raw));
}

/**
 * Merges the curated table with search results into one aggregate per course.
 *
 * Curated rows win on conflict: a human read the post and decided the number.
 * Reports are deduplicated by URL so the same post found twice counts once.
 */
export function buildCourseTimes(
  courses: CourseRef[],
  seeds: CourseTimeSeed[],
  scraped: ScrapedReport[],
): BuildCourseTimesResult {
  const warnings: CourseTimeWarning[] = [];
  const courseByCode = new Map(courses.map((c) => [c.code, c]));

  /**
   * A post can arrive from both sources. The curated day count wins because a
   * human read the post; the searched title wins because it is the real one
   * rather than a slug we un-mangled.
   */
  type MergedReport = CourseTimeReport & {
    daysAreCurated: boolean;
    titleIsDerived: boolean;
  };

  /** courseId → url → report */
  const byCourse = new Map<string, Map<string, MergedReport>>();

  const add = (
    courseId: string,
    incoming: MergedReport,
  ) => {
    const reports = byCourse.get(courseId) ?? new Map<string, MergedReport>();
    const existing = reports.get(incoming.url);
    if (!existing) {
      reports.set(incoming.url, incoming);
    } else {
      const takeDays = incoming.daysAreCurated || !existing.daysAreCurated;
      const takeTitle = existing.titleIsDerived && !incoming.titleIsDerived;
      reports.set(incoming.url, {
        url: existing.url,
        title: takeTitle ? incoming.title : existing.title,
        titleIsDerived: takeTitle ? false : existing.titleIsDerived,
        days: takeDays ? (incoming.days ?? existing.days) : existing.days,
        daysAreCurated: existing.daysAreCurated || incoming.daysAreCurated,
      });
    }
    byCourse.set(courseId, reports);
  };

  for (const seed of seeds) {
    const course = courseByCode.get(seed.code);
    if (!course) {
      warnings.push({ kind: "unknownCourse", code: seed.code });
      continue;
    }

    // The check that caught two bad rows in the original table: if the post
    // slug names other course codes and not this one, the time is not ours.
    const cited = courseCodesInText(seed.url);
    if (cited.length > 0 && !cited.includes(seed.code)) {
      warnings.push({
        kind: "miscited",
        code: seed.code,
        url: seed.url,
        cited,
      });
      continue;
    }

    if (comparableName(seed.name) !== comparableName(course.name)) {
      warnings.push({
        kind: "nameMismatch",
        code: seed.code,
        seedName: seed.name,
        catalogName: course.name,
      });
    }

    add(course.id, {
      url: seed.url,
      title: titleFromUrl(seed.url),
      titleIsDerived: true,
      days: seed.days,
      daysAreCurated: true,
    });
  }

  for (const report of scraped) {
    const course = courseByCode.get(report.code);
    if (!course) continue;
    add(course.id, {
      url: report.url,
      title: report.title,
      titleIsDerived: false,
      days: report.days,
      daysAreCurated: false,
    });
  }

  const courseTimes: CourseTime[] = [];
  for (const [courseId, reports] of byCourse) {
    // The same post crossposted to two subreddits arrives under two URLs and
    // would count twice, dragging the median toward whichever pace got shared
    // more. Two students posting the identical title is rare enough to accept
    // collapsing.
    const byTitle = new Map<string, MergedReport>();
    for (const report of reports.values()) {
      const key = comparableName(report.title);
      const existing = byTitle.get(key);
      if (!existing || (report.daysAreCurated && !existing.daysAreCurated)) {
        byTitle.set(key, report);
      }
    }

    const list: CourseTimeReport[] = [...byTitle.values()]
      .sort((a, b) => {
        // Reports with a number first, then longest-running for stable output.
        if ((a.days ?? 0) !== (b.days ?? 0)) return (b.days ?? 0) - (a.days ?? 0);
        return a.url.localeCompare(b.url);
      })
      .map(({ url, title, days }) => ({ url, title, days }));
    const days = list
      .map((r) => r.days)
      .filter((d): d is number => typeof d === "number");

    courseTimes.push({
      courseId,
      reportCount: days.length,
      medianDays: days.length > 0 ? median(days) : undefined,
      lowDays: days.length > 0 ? Math.min(...days) : undefined,
      highDays: days.length > 0 ? Math.max(...days) : undefined,
      reports: list,
    });
  }

  courseTimes.sort((a, b) => a.courseId.localeCompare(b.courseId));
  return { courseTimes, warnings };
}
