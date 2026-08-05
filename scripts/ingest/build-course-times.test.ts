import { describe, expect, it } from "vitest";
import { buildCourseTimes, type CourseRef, type ScrapedReport } from "./build-course-times";
import type { CourseTimeSeed } from "./course-time-seed";

const courses: CourseRef[] = [
  { id: "course:d335", code: "D335", name: "Introduction to Programming in Python" },
  { id: "course:c683", code: "C683", name: "Natural Science Lab" },
  { id: "course:d683", code: "D683", name: "Advanced AI and ML" },
  { id: "course:d288", code: "D288", name: "Back-End Programming" },
];

const post = (code: string, slug: string) =>
  `https://www.reddit.com/r/WGU/comments/abc123/${slug}/`;

describe("buildCourseTimes", () => {
  it("aggregates a single curated row", () => {
    const seeds: CourseTimeSeed[] = [
      { code: "D335", name: "Introduction to Programming in Python", days: 8, url: post("D335", "d335_passed_in_8_days") },
    ];
    const { courseTimes, warnings } = buildCourseTimes(courses, seeds, []);
    expect(warnings).toEqual([]);
    expect(courseTimes).toHaveLength(1);
    expect(courseTimes[0]).toMatchObject({
      courseId: "course:d335",
      reportCount: 1,
      medianDays: 8,
      lowDays: 8,
      highDays: 8,
    });
  });

  it("takes the median, not the mean, so one long report cannot dominate", () => {
    const seeds: CourseTimeSeed[] = [
      { code: "D335", name: "Introduction to Programming in Python", days: 8, url: post("D335", "d335_a") },
    ];
    const scraped: ScrapedReport[] = [
      { code: "D335", url: post("D335", "d335_b"), title: "D335 in 6 days", days: 6 },
      { code: "D335", url: post("D335", "d335_c"), title: "D335 in 120 days", days: 120 },
    ];
    const [time] = buildCourseTimes(courses, seeds, scraped).courseTimes;
    expect(time.medianDays).toBe(8);
    expect(time.lowDays).toBe(6);
    expect(time.highDays).toBe(120);
    expect(time.reportCount).toBe(3);
  });

  it("rounds an even-count median to a whole day", () => {
    const scraped: ScrapedReport[] = [
      { code: "D335", url: post("D335", "a"), title: "a", days: 3 },
      { code: "D335", url: post("D335", "b"), title: "b", days: 8 },
    ];
    const [time] = buildCourseTimes(courses, [], scraped).courseTimes;
    // (3 + 8) / 2 = 5.5
    expect(time.medianDays).toBe(6);
  });

  it("flags a curated row whose post is about another course and drops it", () => {
    const seeds: CourseTimeSeed[] = [
      {
        code: "D683",
        name: "Advanced AI and ML",
        days: 1,
        url: post("D683", "i_passed_c683_in_a_day_super_easy_class"),
      },
    ];
    const { courseTimes, warnings } = buildCourseTimes(courses, seeds, []);
    expect(courseTimes).toEqual([]);
    expect(warnings).toEqual([
      {
        kind: "miscited",
        code: "D683",
        url: post("D683", "i_passed_c683_in_a_day_super_easy_class"),
        cited: ["C683"],
      },
    ]);
  });

  it("accepts a post that names this course alongside others", () => {
    const seeds: CourseTimeSeed[] = [
      { code: "D335", name: "Introduction to Programming in Python", days: 8, url: post("D335", "d335_and_d288_both_passed") },
    ];
    const { courseTimes, warnings } = buildCourseTimes(courses, seeds, []);
    expect(warnings).toEqual([]);
    expect(courseTimes[0].medianDays).toBe(8);
  });

  it("keeps a report with no duration as a link with no number", () => {
    const seeds: CourseTimeSeed[] = [
      { code: "D288", name: "Back-End Programming", url: post("D288", "i_passed_d288_backend_programming_tips") },
    ];
    const [time] = buildCourseTimes(courses, seeds, []).courseTimes;
    expect(time.reportCount).toBe(0);
    expect(time.medianDays).toBeUndefined();
    expect(time.reports).toHaveLength(1);
  });

  it("counts a post found twice only once, keeping the curated number", () => {
    const url = post("D335", "d335_passed");
    const seeds: CourseTimeSeed[] = [
      { code: "D335", name: "Introduction to Programming in Python", days: 8, url },
    ];
    const scraped: ScrapedReport[] = [
      { code: "D335", url, title: "D335 passed in 30 days", days: 30 },
    ];
    const [time] = buildCourseTimes(courses, seeds, scraped).courseTimes;
    expect(time.reportCount).toBe(1);
    expect(time.medianDays).toBe(8);
    // The real title replaces the one derived from the URL.
    expect(time.reports[0].title).toBe("D335 passed in 30 days");
  });

  it("dates a curated row from the search listings", () => {
    // Curated rows carry a link and no date, so the date comes from the listing
    // that mentions the post — which costs no extra request.
    const url = post("D288", "i_passed_d288_backend_programming_tips");
    const seeds: CourseTimeSeed[] = [
      { code: "D288", name: "Back-End Programming", url },
    ];
    const dates = new Map([[url, "2026-04-08"]]);
    const [time] = buildCourseTimes(courses, seeds, [], dates).courseTimes;
    expect(time.reports[0].postedAt).toBe("2026-04-08");
  });

  it("keeps the date a report arrived with", () => {
    const url = post("D335", "d335_passed");
    const scraped: ScrapedReport[] = [
      { code: "D335", url, title: "D335 in 6 days", days: 6, postedAt: "2026-05-30" },
    ];
    const dates = new Map([[url, "1999-01-01"]]);
    const [time] = buildCourseTimes(courses, [], scraped, dates).courseTimes;
    expect(time.reports[0].postedAt).toBe("2026-05-30");
  });

  it("lists the newest reports first, and undated ones last", () => {
    // Only the first few reach the page, and a course rewritten last year makes
    // an account from 2019 the least useful one to show.
    const scraped: ScrapedReport[] = [
      { code: "D335", url: post("D335", "old"), title: "old", days: 3, postedAt: "2019-02-01" },
      { code: "D335", url: post("D335", "new"), title: "new", days: 9, postedAt: "2026-05-30" },
      { code: "D335", url: post("D335", "mid"), title: "mid", days: 5, postedAt: "2023-07-14" },
      { code: "D335", url: post("D335", "undated"), title: "undated", days: 4 },
    ];
    const [time] = buildCourseTimes(courses, [], scraped).courseTimes;
    expect(time.reports.map((r) => r.title)).toEqual(["new", "mid", "old", "undated"]);
  });

  it("orders curated rows by their listing date too", () => {
    // Curated rows have no date of their own, so ordering has to wait for the
    // listing date rather than fall back to comparing URLs.
    const older = post("D335", "older_post");
    const newer = post("D335", "newer_post");
    const seeds: CourseTimeSeed[] = [
      { code: "D335", name: "Introduction to Programming in Python", days: 2, url: older },
      { code: "D335", name: "Introduction to Programming in Python", days: 2, url: newer },
    ];
    const dates = new Map([
      [older, "2026-04-08"],
      [newer, "2026-05-08"],
    ]);
    const [time] = buildCourseTimes(courses, seeds, [], dates).courseTimes;
    expect(time.reports.map((r) => r.postedAt)).toEqual(["2026-05-08", "2026-04-08"]);
  });

  it("lists a report with a number ahead of one without", () => {
    const scraped: ScrapedReport[] = [
      { code: "D335", url: post("D335", "read"), title: "read", postedAt: "2026-06-01" },
      { code: "D335", url: post("D335", "days"), title: "days", days: 5, postedAt: "2020-01-01" },
    ];
    const [time] = buildCourseTimes(courses, [], scraped).courseTimes;
    expect(time.reports.map((r) => r.title)).toEqual(["days", "read"]);
  });

  it("counts a crossposted report once", () => {
    // Same post in two subreddits: two URLs, one student, one data point.
    const scraped: ScrapedReport[] = [
      {
        code: "D335",
        url: post("D335", "wgu_copy"),
        title: "DONE WITH D335 IN 4 DAYS!!!",
        days: 4,
      },
      {
        code: "D335",
        url: post("D335", "wguit_copy"),
        title: "DONE WITH D335 IN 4 DAYS!!!",
        days: 4,
      },
      { code: "D335", url: post("D335", "other"), title: "D335 in 20 days", days: 20 },
    ];
    const [time] = buildCourseTimes(courses, [], scraped).courseTimes;
    expect(time.reportCount).toBe(2);
    expect(time.medianDays).toBe(12);
  });

  it("reports a curated code the catalog does not have", () => {
    const seeds: CourseTimeSeed[] = [
      { code: "C999", name: "Retired Course", days: 3, url: post("C999", "c999_passed") },
    ];
    const { courseTimes, warnings } = buildCourseTimes(courses, seeds, []);
    expect(courseTimes).toEqual([]);
    expect(warnings).toEqual([{ kind: "unknownCourse", code: "C999" }]);
  });

  it("reports a curated name that drifted from the catalog, but keeps the time", () => {
    const seeds: CourseTimeSeed[] = [
      { code: "D335", name: "Intro to Python", days: 8, url: post("D335", "d335_passed") },
    ];
    const { courseTimes, warnings } = buildCourseTimes(courses, seeds, []);
    expect(warnings).toEqual([
      {
        kind: "nameMismatch",
        code: "D335",
        seedName: "Intro to Python",
        catalogName: "Introduction to Programming in Python",
      },
    ]);
    expect(courseTimes[0].medianDays).toBe(8);
  });

  it("treats dash width and punctuation as the same name", () => {
    const seeds: CourseTimeSeed[] = [
      { code: "D288", name: "Back End Programming", url: post("D288", "d288_tips") },
    ];
    expect(buildCourseTimes(courses, seeds, []).warnings).toEqual([]);
  });

  it("ignores search results for courses outside the catalog", () => {
    const scraped: ScrapedReport[] = [
      { code: "C999", url: post("C999", "c999"), title: "C999 in 3 days", days: 3 },
    ];
    expect(buildCourseTimes(courses, [], scraped).courseTimes).toEqual([]);
  });
});
