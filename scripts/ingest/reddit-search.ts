/**
 * Community clear times from Reddit search.
 *
 * This reads the HTML search page, which is the only listing surface still
 * open to a plain client — the JSON endpoints refuse unauthenticated clients.
 * Treat it as best-effort: it is rate-limited, it can start refusing at any
 * time, and it is a courtesy rather than a supported interface. The curated
 * table is the baseline, so a blocked run degrades to reviewed data instead of
 * to nothing.
 */

import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import * as cheerio from "cheerio";
import type { ScrapedReport } from "./build-course-times";
import {
  courseCodesInText,
  describesCompletion,
  parseDurationDays,
} from "./parse-duration";

const SUBREDDITS = [
  "WGU",
  "WGUIT",
  "WGU_CompSci",
  "WGUCyberSecurity",
  "wgu_devs",
  "WGU_BSCNE",
];

/** Keep the most relevant handful; beyond that the results drift off-topic. */
const MAX_PER_COURSE = 6;

/**
 * Above this many course codes in one title, the duration covers a whole term
 * or degree rather than a course — "Completed BSCSIA in 159 days" followed by a
 * class list would otherwise give 159 days to every course named. Two codes is
 * normal and kept, because WGU renumbers courses and posters cite both.
 */
const MAX_CODES_PER_TITLE = 2;

/** Re-reading search pages daily would be rude and pointless. */
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function searchUrl(code: string): string {
  const params = new URLSearchParams({
    q: code,
    restrict_sr: "1",
    sort: "relevance",
    t: "all",
  });
  return `https://old.reddit.com/r/${SUBREDDITS.join("+")}/search?${params}`;
}

/** Reddit links are stored on the canonical host, not the legacy one. */
function canonicalPostUrl(href: string): string | null {
  try {
    const url = new URL(href, "https://old.reddit.com");
    if (!/(^|\.)reddit\.com$/.test(url.hostname)) return null;
    if (!url.pathname.includes("/comments/")) return null;
    return `https://www.reddit.com${url.pathname}`;
  } catch {
    return null;
  }
}

/**
 * Pulls reports for one course out of a search page.
 *
 * A result is kept only when the title claims a pass, states a duration we can
 * read, and actually concerns this course. Search relevance alone is not
 * enough: a query for D335 returns posts that merely mention it.
 */
export function parseSearchResultsHtml(
  html: string,
  code: string,
  maxPerCourse: number = MAX_PER_COURSE,
): ScrapedReport[] {
  const $ = cheerio.load(html);
  const reports: ScrapedReport[] = [];
  const seen = new Set<string>();

  $("a.search-title").each((_, el) => {
    if (reports.length >= maxPerCourse) return;

    const title = $(el).text().trim();
    const href = $(el).attr("href");
    if (!title || !href) return;

    const url = canonicalPostUrl(href);
    if (!url || seen.has(url)) return;

    const titleCodes = courseCodesInText(title);
    const mentioned = new Set([...titleCodes, ...courseCodesInText(url)]);
    if (!mentioned.has(code)) return;
    if (titleCodes.length > MAX_CODES_PER_TITLE) return;

    if (!describesCompletion(title)) return;

    const duration = parseDurationDays(title);
    if (!duration) return;

    seen.add(url);
    reports.push({ code, url, title, days: duration.days });
  });

  return reports;
}

export type SearchOptions = {
  cacheDir: string;
  userAgent: string;
  delayMs: number;
  maxPerCourse?: number;
  log?: (message: string) => void;
};

export type SearchOutcome = {
  reports: ScrapedReport[];
  /** Course codes we could neither fetch nor serve from cache. */
  failedCodes: string[];
  /** Set when Reddit asked us to stop, so the run ended early on purpose. */
  rateLimited: boolean;
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readFresh(file: string): Promise<string | undefined> {
  try {
    const info = await stat(file);
    if (Date.now() - info.mtimeMs > CACHE_TTL_MS) return undefined;
    return await readFile(file, "utf8");
  } catch {
    return undefined;
  }
}

export async function searchCourseReports(
  codes: string[],
  options: SearchOptions,
): Promise<SearchOutcome> {
  const { cacheDir, userAgent, delayMs, maxPerCourse, log = () => {} } = options;
  await mkdir(cacheDir, { recursive: true });

  const reports: ScrapedReport[] = [];
  const failedCodes: string[] = [];
  let rateLimited = false;

  for (const code of codes) {
    const cacheFile = path.join(cacheDir, `${code}.html`);

    let html = await readFresh(cacheFile);
    if (!html && !rateLimited) {
      try {
        const res = await fetch(searchUrl(code), {
          headers: { "user-agent": userAgent, accept: "text/html" },
        });
        if (res.status === 429) {
          // Being asked to slow down means stop, not retry harder.
          rateLimited = true;
          log(`  ! rate limited at ${code}; keeping what we have`);
        } else if (!res.ok) {
          log(`  ! ${code}: search returned ${res.status}`);
        } else {
          html = await res.text();
          await writeFile(cacheFile, html, "utf8");
        }
      } catch (err) {
        log(`  ! ${code}: ${(err as Error).message}`);
      }
      await delay(delayMs);
    }

    if (!html) {
      // Fall back to a stale copy before giving up on the course.
      html = await readFile(cacheFile, "utf8").catch(() => undefined);
    }
    if (!html) {
      failedCodes.push(code);
      continue;
    }

    reports.push(...parseSearchResultsHtml(html, code, maxPerCourse));
  }

  return { reports, failedCodes, rateLimited };
}
