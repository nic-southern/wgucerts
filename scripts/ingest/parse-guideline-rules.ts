import {
  parseCertMentions,
  splitTopLevel,
  type CertMention,
} from "./cert-match";
import type { ApiGuidelineRow } from "./partner-api";

/**
 * Turns a transfer guideline row into the rules the app needs. Each row states,
 * in prose, what WGU accepts for one course:
 *
 *   D281: One course equivalent to 3 units in Linux foundations, or one of the
 *   following certifications: CompTIA: Linux+; LPI: Linux Essentials, LPIC-1 …
 */
export type GuidelineRule = {
  courseCode: string;
  /** Programs the rule applies to. The same course can be treated differently. */
  apiProgramIds: number[];
  /** WGU accepts no transfer credit for this course in these programs. */
  nonTransferable: boolean;
  certMentions: CertMention[];
};

const NON_TRANSFERABLE_AREA = "non-transferable";

/** Where an explicit cert list begins: "one of the following certifications:". */
const CERT_LIST_START_RE = /following\s+certificat\w*\s*:?/i;

/** Sentences that follow a cert list and are not part of it. */
const CERT_LIST_END_RE =
  /\bmay be satisfied\b|\bcourse and\/or\b|\bmust have been taken\b|\bcourse has to be\b|\bmust be taken\b|\bcannot be\b/i;

/** Any mention of a credential, used to spot rows worth a closer look. */
const CERT_WORD_RE = /\bcerts?\b|\bcertifications?\b|\bcertificates?\b/i;

/**
 * A vendor stated as a label, e.g. "Python Institute's: PCAP Cert". Enough on
 * its own to mark a clause as naming a credential.
 */
const VENDOR_LABEL_CLAUSE_RE = /^[A-Za-z][A-Za-z0-9 .'’()\-]{1,28}:/;

/** Prose that introduces a credential without adding to its name. */
const CLAUSE_LEAD_IN_RE =
  /^(?:(?:can|may|will)\s+be\s+satisfied\s+by\s+)?(?:or\s+|and\s+)?(?:by\s+)?(?:an?\s+|the\s+)?(?:active\s+|current\s+|valid\s+)?/i;

function normalizeProse(value: string): string {
  return value
    // A zero-width space leads many requirement strings.
    .replace(/[\u200b\u200e\u200f]/g, "")
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** True when a row talks about credentials at all. */
export function mentionsCertifications(requirements: string): boolean {
  return CERT_WORD_RE.test(normalizeProse(requirements));
}

/**
 * Most rows introduce credentials with an explicit list header. A few instead
 * fold a single certification into the sentence ("…or can be satisfied by an
 * active ITIL foundations Certification"), so fall back to reading the clauses
 * that name a credential.
 */
export function extractCertMentions(requirements: string): CertMention[] {
  const prose = normalizeProse(requirements);
  if (!prose) return [];

  const listStart = prose.search(CERT_LIST_START_RE);
  if (listStart >= 0) {
    const afterHeader = prose
      .slice(listStart)
      .replace(CERT_LIST_START_RE, "")
      .trim();
    const listEnd = afterHeader.search(CERT_LIST_END_RE);
    const list = listEnd >= 0 ? afterHeader.slice(0, listEnd) : afterHeader;
    return parseCertMentions(list);
  }

  if (!CERT_WORD_RE.test(prose)) return [];

  const end = prose.search(CERT_LIST_END_RE);
  const body = end >= 0 ? prose.slice(0, end) : prose;
  const clauses = splitTopLevel(body)
    .map((clause) => clause.replace(CLAUSE_LEAD_IN_RE, "").trim())
    .filter(
      (clause) =>
        CERT_WORD_RE.test(clause) || VENDOR_LABEL_CLAUSE_RE.test(clause),
    );
  if (clauses.length === 0) return [];

  return parseCertMentions(clauses.join("; "));
}

export function buildGuidelineRules(rows: ApiGuidelineRow[]): GuidelineRule[] {
  const byKey = new Map<string, GuidelineRule>();

  for (const row of rows) {
    const nonTransferable =
      row.transferArea.toLowerCase() === NON_TRANSFERABLE_AREA;
    const certMentions = nonTransferable
      ? []
      : extractCertMentions(row.requirements);

    // One row can cover several programs, and a course can appear in more than
    // one row, so merge on course + how the course is treated.
    const key = `${row.courseCode}::${nonTransferable}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, {
        courseCode: row.courseCode,
        apiProgramIds: [...row.apiProgramIds],
        nonTransferable,
        certMentions,
      });
      continue;
    }

    for (const id of row.apiProgramIds) {
      if (!existing.apiProgramIds.includes(id)) existing.apiProgramIds.push(id);
    }
    existing.certMentions.push(...certMentions);
  }

  return [...byKey.values()].sort(
    (a, b) =>
      a.courseCode.localeCompare(b.courseCode) ||
      Number(a.nonTransferable) - Number(b.nonTransferable),
  );
}
