import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { CourseTime } from "@/lib/catalog/schema";
import { CourseTimeNote } from "./course-time-note";

const time = (overrides: Partial<CourseTime> = {}): CourseTime => ({
  courseId: "course:d426",
  reportCount: 2,
  medianDays: 13,
  lowDays: 5,
  highDays: 21,
  reports: [
    {
      url: "https://www.reddit.com/r/WGU/comments/a/how_i_passed_d426_in_about_5_days/",
      title: "How I Passed D426 In About 5 Days",
      days: 5,
      postedAt: "2026-06-02",
    },
    {
      url: "https://www.reddit.com/r/WGU/comments/b/d426_how_to_pass/",
      title: "D426 how to pass",
      days: 21,
    },
  ],
  ...overrides,
});

const render = (element: React.ReactElement) =>
  renderToStaticMarkup(element).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

describe("CourseTimeNote", () => {
  it("dates a report by month, since a posting day is not a finishing day", () => {
    expect(render(<CourseTimeNote time={time()} />)).toContain("Jun 2026");
  });

  it("leaves a report undated rather than guessing", () => {
    const text = render(<CourseTimeNote time={time()} />);
    expect(text).toContain("21 days");
    expect(text.match(/\d{4}/g)).toEqual(["2026"]);
  });

  it("summarises the spread alongside the count", () => {
    expect(render(<CourseTimeNote time={time()} />)).toContain(
      "Around 13 days · 2 student reports · 5–21 days reported",
    );
  });

  it("still lists the sources for a course already finished", () => {
    const markup = renderToStaticMarkup(
      <CourseTimeNote time={time()} showEmpty={false} />,
    );
    expect(markup).toContain("how_i_passed_d426_in_about_5_days");
  });

  it("says nothing about a finished course with no reports", () => {
    expect(
      renderToStaticMarkup(<CourseTimeNote time={null} showEmpty={false} />),
    ).toBe("");
  });

  it("admits when a course has no reports yet", () => {
    expect(render(<CourseTimeNote time={null} />)).toBe("No student reports yet");
  });

  it("links a report that never states a duration", () => {
    const linkOnly = time({
      reportCount: 0,
      medianDays: undefined,
      lowDays: undefined,
      highDays: undefined,
      reports: [
        {
          url: "https://www.reddit.com/r/WGUIT/comments/c/anyone_have_insight/",
          title: "Anyone have insight to the new BSIT courses?",
          postedAt: "2026-04-08",
        },
      ],
    });
    expect(render(<CourseTimeNote time={linkOnly} />)).toBe(
      "No time given Read Apr 2026",
    );
  });
});
