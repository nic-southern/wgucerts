import { describe, expect, it } from "vitest";
import {
  parsePostDates,
  parseSearchResultsHtml,
  searchUrl,
} from "./reddit-search";

/**
 * Markup shape and titles copied from a live search for D335. Results are flat
 * siblings on the page: the meta block follows the header rather than sharing a
 * wrapper with it.
 */
const result = (slug: string, title: string, submitted = "2026-06-02T22:40:46+00:00") => `
  <header class="search-result-header">
    <a href="https://old.reddit.com/r/WGU/comments/${slug}/" class="search-title may-blank" >${title}</a>
  </header>
  <div class="search-result-meta">
    <span class="search-time">submitted&#32;<time datetime="${submitted}">1 month ago</time></span>
  </div>`;

const page = (...results: string[]) =>
  `<div class="search-result-group">${results.join("")}</div>`;

describe("searchUrl", () => {
  it("searches the WGU subreddits and nothing else", () => {
    const url = searchUrl("D335");
    expect(url).toContain("/r/WGU+WGUIT+WGU_CompSci+WGUCyberSecurity+wgu_devs+WGU_BSCNE/search");
    expect(url).toContain("q=D335");
    expect(url).toContain("restrict_sr=1");
  });
});

describe("parseSearchResultsHtml", () => {
  it("keeps a pass with a stated duration", () => {
    const html = page(
      result(
        "1kluz5d",
        "I passed D335 - Introduction to Programming in Python in 18 days. Here's how I did it.",
      ),
    );
    expect(parseSearchResultsHtml(html, "D335")).toEqual([
      {
        code: "D335",
        url: "https://www.reddit.com/r/WGU/comments/1kluz5d/",
        title:
          "I passed D335 - Introduction to Programming in Python in 18 days. Here's how I did it.",
        days: 18,
        postedAt: "2026-06-02",
      },
    ]);
  });

  it("dates each report by the day it was submitted", () => {
    const html = page(
      result("a", "Passed D335 in 3 days", "2019-01-07T04:00:00+00:00"),
      result("b", "Passed D335 in 4 days", "2026-05-30T12:30:00+00:00"),
    );
    expect(parseSearchResultsHtml(html, "D335").map((r) => r.postedAt)).toEqual([
      "2019-01-07",
      "2026-05-30",
    ]);
  });

  it("leaves the date off when the listing has none", () => {
    const html = page(`
      <header class="search-result-header">
        <a href="https://old.reddit.com/r/WGU/comments/x9/" class="search-title">Passed D335 in 3 days</a>
      </header>`);
    expect(parseSearchResultsHtml(html, "D335")[0].postedAt).toBeUndefined();
  });

  it("drops results that state no duration", () => {
    const html = page(
      result("1ufl91i", "Passed D335"),
      result("1u54rtk", "Passed D335 first try! No experience"),
    );
    expect(parseSearchResultsHtml(html, "D335")).toEqual([]);
  });

  it("drops results that are not reporting a pass", () => {
    const html = page(
      result("1u9f61m", "Struggling with D335 for 3 weeks - multiple attempts"),
      result("1tshmuo", "A mindset shift that may help if D335 feels impossible"),
      result("x1", "Failed D335 after 2 weeks"),
    );
    expect(parseSearchResultsHtml(html, "D335")).toEqual([]);
  });

  it("drops results that never name the course", () => {
    // Search relevance surfaces posts that only mention a course in the body.
    const html = page(result("x2", "Passed my first class in 5 days, so relieved"));
    expect(parseSearchResultsHtml(html, "D335")).toEqual([]);
  });

  it("keeps a post citing an old and new code for the same course", () => {
    // WGU renumbers courses, so posters routinely name both.
    const html = page(result("x3", "D320 C838 passed in 5 days"));
    expect(parseSearchResultsHtml(html, "D320")[0].days).toBe(5);
  });

  it("drops a term or degree summary that lists many courses", () => {
    // This title gave 159 days to every course it named.
    const html = page(
      result(
        "x4",
        "Completed BSCSIA In 159 Days - 14 Classes Master List: C841, C844, C840, C843",
      ),
    );
    expect(parseSearchResultsHtml(html, "C844")).toEqual([]);
  });

  it("drops a combined duration covering several courses at once", () => {
    // 20 days bought all three, so it is not 20 days for any one of them.
    const html = page(
      result("x5", "Passed D496 D497 D498 in 20 days via the nanodegree"),
    );
    expect(parseSearchResultsHtml(html, "D497")).toEqual([]);
  });

  it("recognises the course from the link when the title omits it", () => {
    const html = page(result("d335_passed_in_9_days", "Passed intro python in 9 days"));
    const [report] = parseSearchResultsHtml(html, "D335");
    expect(report.days).toBe(9);
  });

  it("stores canonical post links", () => {
    const html = page(result("1kluz5d", "Passed D335 in 4 days"));
    expect(parseSearchResultsHtml(html, "D335")[0].url).toBe(
      "https://www.reddit.com/r/WGU/comments/1kluz5d/",
    );
  });

  it("ignores links that are not reddit posts", () => {
    const html = `<a href="https://example.com/passed-d335-in-3-days" class="search-title">Passed D335 in 3 days</a>`;
    expect(parseSearchResultsHtml(html, "D335")).toEqual([]);
  });

  it("counts the same post once and caps how many it keeps", () => {
    const html = page(
      result("dupe", "Passed D335 in 3 days"),
      result("dupe", "Passed D335 in 3 days"),
      result("a", "Passed D335 in 4 days"),
      result("b", "Passed D335 in 5 days"),
    );
    expect(parseSearchResultsHtml(html, "D335")).toHaveLength(3);
    expect(parseSearchResultsHtml(html, "D335", 2)).toHaveLength(2);
  });
});

describe("parsePostDates", () => {
  it("dates posts the report filters throw away", () => {
    // The curated table cites posts like these, whose titles state no duration.
    const html = page(
      result("x1", "How to pass D267", "2026-04-30T18:18:53+00:00"),
      result("x2", "Anyone have insight to the new BSIT courses?", "2026-04-08T15:03:48+00:00"),
    );
    expect(parseSearchResultsHtml(html, "D267")).toEqual([]);
    expect(parsePostDates(html)).toEqual(
      new Map([
        ["https://www.reddit.com/r/WGU/comments/x1/", "2026-04-30"],
        ["https://www.reddit.com/r/WGU/comments/x2/", "2026-04-08"],
      ]),
    );
  });

  it("skips anything that is not a dated post link", () => {
    const html = page(
      `<a href="https://example.com/x" class="search-title">Offsite</a>`,
      result("x3", "Passed D335"),
    );
    expect(parsePostDates(html)).toEqual(
      new Map([["https://www.reddit.com/r/WGU/comments/x3/", "2026-06-02"]]),
    );
  });
});
