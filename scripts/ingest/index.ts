import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PDFParse } from "pdf-parse";
import { catalogSchema } from "../../src/lib/catalog/schema";
import {
  buildCertCourseClears,
  type UnresolvedMention,
} from "./build-cert-clears";
import { buildCoursesFromCatalog } from "./build-courses";
import {
  buildCourseTimes,
  type CourseTimeWarning,
} from "./build-course-times";
import { CURATED_COURSE_TIMES } from "./course-time-seed";
import { DEGREE_RULES } from "./course-seed";
import { searchCourseReports, type SearchOutcome } from "./reddit-search";
import {
  buildGuidelineRules,
  mentionsCertifications,
} from "./parse-guideline-rules";
import { parseInstitutionalCatalogText } from "./parse-institutional-catalog";
import { parseTransferableCertsHtml } from "./parse-transferable-certs";
import {
  fetchLiveItPrograms,
  fetchTransferGuidelines,
  PARTNER_GUIDELINES_URL,
  type ApiGuidelineRow,
} from "./partner-api";
import { certificateIdFrom, programIdFromName, providerIdFromName, slugify } from "./slug";
import {
  TRANSFER_CLEARS,
  TRANSFER_COURSES,
  TRANSFER_PROVIDERS,
} from "./transfer-seed";

const TRANSFERABLE_CERTS_URL =
  "https://www.wgu.edu/admissions/transfers/wgu-transcript-request/transferable-certifications.html";
const IT_DEGREES_URL = "https://www.wgu.edu/online-it-degrees.html";
const INSTITUTIONAL_CATALOG_URL =
  "https://www.wgu.edu/content/dam/wgu-65-assets/western-governors/documents/institutional-catalog/2026/catalog-may-2026.pdf";

/** WGU's asset host rejects unfamiliar clients and rate-limits bursts. */
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const FETCH_DELAY_MS = 600;

/** Reddit is doing us a favour by answering at all; go slower there. */
const REDDIT_DELAY_MS = 1000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "user-agent": BROWSER_USER_AGENT,
      accept: "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return res.text();
}

async function fetchPdfText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "user-agent": BROWSER_USER_AGENT, accept: "application/pdf" },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  const parser = new PDFParse({ data: new Uint8Array(await res.arrayBuffer()) });
  const result = await parser.getText();
  await parser.destroy();
  return result.text;
}

/**
 * Caches extracted PDF text next to the catalog. Keeps repeat runs cheap and
 * lets a rate-limited fetch fall back to the previous run's text.
 */
async function loadPdfText(url: string, cacheName: string): Promise<string> {
  const cachePath = path.resolve(process.cwd(), "data/catalog", cacheName);
  try {
    const text = await fetchPdfText(url);
    await mkdir(path.dirname(cachePath), { recursive: true });
    await writeFile(cachePath, text, "utf8");
    return text;
  } catch (err) {
    const cached = await readFile(cachePath, "utf8").catch(() => undefined);
    if (cached) {
      console.warn(`  ! ${cacheName}: ${(err as Error).message} — using cached text`);
      return cached;
    }
    throw err;
  }
}

async function main() {
  console.log("Fetching live IT programs…");
  const apiPrograms = await fetchLiveItPrograms();
  console.log(`  ${apiPrograms.length} programs currently offered`);
  for (const p of apiPrograms) {
    console.log(`  - ${p.code.padEnd(9)} ${p.name}`);
  }

  const programs = apiPrograms.map((p) => ({
    apiId: p.apiId,
    id: programIdFromName(p.name),
    name: p.name,
    slug: slugify(p.name),
    code: p.code,
    degreeLevel: "bachelors" as const,
    url: IT_DEGREES_URL,
  }));
  const programIdByApiId = new Map(programs.map((p) => [p.apiId, p.id]));

  console.log("Fetching institutional catalog PDF…");
  const catalogText = await loadPdfText(
    INSTITUTIONAL_CATALOG_URL,
    "institutional-catalog.txt",
  );
  const catalogPrograms = parseInstitutionalCatalogText(catalogText);
  console.log(
    `  ${catalogPrograms.length} program course tables parsed from institutional catalog`,
  );

  const {
    courses,
    programCourseIds,
    programTotalCus,
    programsWithoutCourses,
  } = buildCoursesFromCatalog(programs, catalogPrograms);

  if (programsWithoutCourses.length > 0) {
    throw new Error(
      `No institutional-catalog course table for: ${programsWithoutCourses
        .map((p) => p.code)
        .join(", ")}. Add a matcher in parse-institutional-catalog.ts.`,
    );
  }

  console.log("Fetching transferable certifications…");
  const parsed = parseTransferableCertsHtml(await fetchText(TRANSFERABLE_CERTS_URL));

  const providers = [...parsed.providers];
  const certificates = [...parsed.certificates];

  const ensureCert = (providerName: string, certName: string) => {
    const providerId = providerIdFromName(providerName);
    if (!providers.some((p) => p.id === providerId)) {
      providers.push({ id: providerId, name: providerName });
    }
    const certificateId = certificateIdFrom(providerId, certName);
    if (!certificates.some((c) => c.id === certificateId)) {
      certificates.push({ id: certificateId, providerId, name: certName });
    }
    return certificateId;
  };

  for (const name of [
    "CompTIA A+ CE",
    "CompTIA Network+",
    "CompTIA Security+",
    "CompTIA CySA+",
    "CompTIA Project+",
    "CompTIA Tech+",
  ]) {
    ensureCert("CompTIA", name);
  }

  console.log("Fetching transfer guidelines…");
  const guidelineRows: ApiGuidelineRow[] = [];
  for (const program of programs) {
    const rows = await fetchTransferGuidelines(program.apiId);
    guidelineRows.push(...rows);
    console.log(`  - ${program.code.padEnd(9)} ${rows.length} rules`);
    await delay(FETCH_DELAY_MS);
  }

  const rules = buildGuidelineRules(guidelineRows);
  console.log(`  ${rules.length} distinct course rules`);

  const {
    clears: certCourseClears,
    nonTransferable,
    unresolved,
    skippedCourseCodes,
  } = buildCertCourseClears({
    certificates,
    providers,
    courses,
    rules,
    programIdByApiId,
    source: "WGU general transfer guidelines",
  });

  const transferCourseClears: {
    transferCourseId: string;
    courseId: string;
    source: string;
    confidence: "published" | "estimated";
  }[] = [];
  const transferClearKeys = new Set<string>();

  const normalizeForMatch = (value: string) =>
    value
      .toLowerCase()
      .replace(/[–—−]/g, "-")
      .replace(/\s+/g, " ")
      .trim();

  for (const rule of TRANSFER_CLEARS) {
    const matches = courses.filter((course) => {
      if (
        rule.wguCode &&
        course.code.toUpperCase() === rule.wguCode.toUpperCase()
      ) {
        return true;
      }
      return rule.wguNameMatch.test(normalizeForMatch(course.name));
    });
    for (const course of matches) {
      const key = `${rule.transferCourseId}::${course.id}`;
      if (transferClearKeys.has(key)) continue;
      transferClearKeys.add(key);
      transferCourseClears.push({
        transferCourseId: rule.transferCourseId,
        courseId: course.id,
        source: rule.source,
        confidence: rule.confidence,
      });
    }
  }

  // Times are best-effort. Set INGEST_SKIP_REDDIT=1 to build from the curated
  // table alone, which is what a blocked or throttled run falls back to anyway.
  const skipReddit = process.env.INGEST_SKIP_REDDIT === "1";
  let search: SearchOutcome = { reports: [], failedCodes: [], rateLimited: false };
  if (skipReddit) {
    console.log("Skipping community clear-time search (INGEST_SKIP_REDDIT=1)");
  } else {
    console.log("Searching for community clear times…");
    search = await searchCourseReports(
      courses.map((c) => c.code).sort(),
      {
        cacheDir: path.resolve(process.cwd(), "data/cache/reddit"),
        userAgent: BROWSER_USER_AGENT,
        delayMs: REDDIT_DELAY_MS,
        log: (message) => console.log(message),
      },
    );
    console.log(`  ${search.reports.length} reports read from search results`);
  }

  const { courseTimes, warnings: courseTimeWarnings } = buildCourseTimes(
    courses,
    CURATED_COURSE_TIMES,
    search.reports,
  );

  const catalog = catalogSchema.parse({
    meta: {
      fetchedAt: new Date().toISOString(),
      sources: [
        { name: "WGU General Transfer Guidelines", url: PARTNER_GUIDELINES_URL },
        {
          name: "WGU Institutional Catalog (May 2026)",
          url: INSTITUTIONAL_CATALOG_URL,
        },
        {
          name: "WGU Transferable Certifications",
          url: TRANSFERABLE_CERTS_URL,
        },
        { name: "WGU Online IT Degrees", url: IT_DEGREES_URL },
        {
          name: "Sophia WGU College of IT transfer chart",
          url: "https://wgucollegeofinformationtechnology.sophia.org/",
        },
      ],
    },
    providers: providers.sort((a, b) => a.name.localeCompare(b.name)),
    certificates: certificates.sort((a, b) => a.name.localeCompare(b.name)),
    programs: programs
      .map((program) => ({
        id: program.id,
        name: program.name,
        slug: program.slug,
        code: program.code,
        degreeLevel: program.degreeLevel,
        url: program.url,
        totalCus: programTotalCus.get(program.id),
        courseIds: programCourseIds.get(program.id) ?? [],
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    courses,
    programCertEligibility: parsed.eligibility.filter((e) =>
      programs.some((p) => p.id === e.programId),
    ),
    certCourseClears,
    nonTransferableCourses: nonTransferable,
    transferProviders: TRANSFER_PROVIDERS,
    transferCourses: TRANSFER_COURSES,
    transferCourseClears,
    courseTimes,
    degreeRules: DEGREE_RULES,
  });

  const outDir = path.resolve(process.cwd(), "data/catalog");
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, "catalog.json");
  await writeFile(outPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");

  console.log(`Wrote ${outPath}`);
  for (const p of catalog.programs) {
    console.log(
      `  ${p.name}: ${p.courseIds.length} courses, ${p.totalCus ?? 0} CUs`,
    );
  }

  reportCoverage(catalog, {
    unresolved,
    skippedCourseCodes,
    guidelineRows,
    rules,
  });

  reportCourseTimes(catalog.courseTimes, courses, courseTimeWarnings, search);
}

/**
 * Clear-time coverage and every rejected row. A curated row that quietly stops
 * matching the catalog would otherwise just vanish from the site.
 */
function reportCourseTimes(
  courseTimes: { courseId: string; reportCount: number; medianDays?: number }[],
  courses: { id: string; code: string }[],
  warnings: CourseTimeWarning[],
  search: SearchOutcome,
) {
  const withNumber = courseTimes.filter((t) => t.reportCount > 0);
  const totalReports = courseTimes.reduce((sum, t) => sum + t.reportCount, 0);

  console.log("Community clear times:");
  console.log(
    `  ${withNumber.length}/${courses.length} courses have a time, from ${totalReports} reports`,
  );

  const linkOnly = courseTimes.length - withNumber.length;
  if (linkOnly > 0) {
    console.log(`  ${linkOnly} courses have a linked report but no stated time`);
  }

  if (search.rateLimited) {
    console.log("  ! search stopped early on a rate limit; times may be thin");
  }
  if (search.failedCodes.length > 0) {
    console.log(
      `  ${search.failedCodes.length} courses could not be searched: ${search.failedCodes.join(", ")}`,
    );
  }

  for (const warning of warnings) {
    if (warning.kind === "miscited") {
      console.log(
        `  ! ${warning.code}: cited post is about ${warning.cited.join(", ")} — row dropped (${warning.url})`,
      );
    } else if (warning.kind === "unknownCourse") {
      console.log(`  ! ${warning.code}: no such course in any program we publish`);
    } else {
      console.log(
        `  ! ${warning.code}: curated name "${warning.seedName}" vs catalog "${warning.catalogName}"`,
      );
    }
  }
}

/**
 * Coverage and misses are printed every run: a certification WGU names in a
 * guideline but that we cannot match is a data gap, and silence hid the last one.
 */
function reportCoverage(
  catalog: {
    certificates: { id: string }[];
    courses: { id: string; code: string; name: string }[];
    certCourseClears: { certificateId: string; courseId: string }[];
    nonTransferableCourses: { courseId: string }[];
    transferCourseClears: { courseId: string }[];
  },
  detail: {
    unresolved: UnresolvedMention[];
    skippedCourseCodes: string[];
    guidelineRows: ApiGuidelineRow[];
    rules: { courseCode: string; certMentions: unknown[] }[];
  },
) {
  const certsWithClears = new Set(
    catalog.certCourseClears.map((c) => c.certificateId),
  );
  const coursesWithClears = new Set(catalog.certCourseClears.map((c) => c.courseId));

  console.log("Certification clears:");
  console.log(
    `  ${catalog.certCourseClears.length} rules covering ${certsWithClears.size}/${catalog.certificates.length} certificates and ${coursesWithClears.size}/${catalog.courses.length} courses`,
  );
  console.log(
    `  ${catalog.nonTransferableCourses.length} courses WGU marks non-transferable`,
  );

  // A guideline that names a credential but yields no rule is a parser gap.
  const codesWithMentions = new Set(
    detail.rules.filter((r) => r.certMentions.length > 0).map((r) => r.courseCode),
  );
  const missedRows = detail.guidelineRows.filter(
    (row) =>
      mentionsCertifications(row.requirements) &&
      !codesWithMentions.has(row.courseCode),
  );
  const missedCodes = [...new Set(missedRows.map((r) => r.courseCode))].sort();
  if (missedCodes.length > 0) {
    console.log(
      `  ${missedCodes.length} guidelines name a credential we read nothing from: ${missedCodes.join(", ")}`,
    );
  }

  if (detail.skippedCourseCodes.length > 0) {
    console.log(
      `  ${detail.skippedCourseCodes.length} guideline courses are not in any program we publish`,
    );
  }

  if (detail.unresolved.length === 0) return;

  const grouped = new Map<string, string[]>();
  for (const item of detail.unresolved) {
    const label = `${item.vendor ? `${item.vendor} ` : ""}${item.text}`;
    grouped.set(label, [...(grouped.get(label) ?? []), item.course]);
  }
  console.log(
    `  ${grouped.size} certification names in WGU guidelines matched no certificate:`,
  );
  for (const [label, courses] of [...grouped].sort()) {
    console.log(`    ${label}  (${[...new Set(courses)].join(", ")})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
