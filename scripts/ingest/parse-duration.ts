/**
 * Elapsed-time parsing for community course reports.
 *
 * Post titles state how long a course took in wildly inconsistent ways. This
 * reads only the phrasings we can defend and returns null for everything else,
 * because a wrong number next to a course is worse than no number at all.
 */

/** Below this many days a report is not a credible single-course claim. */
const MIN_DAYS = 1;
/** Above this, the poster is describing a program or a term, not a course. */
const MAX_DAYS = 365;

const NUMBER_WORDS: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  fifteen: 15,
  twenty: 20,
  thirty: 30,
};

const DAYS_PER_UNIT: Record<string, number> = {
  hour: 1 / 24,
  day: 1,
  week: 7,
  month: 30,
};

/**
 * Phrasings that mean "one sitting" without naming a unit. `24/7` style noise
 * is excluded by requiring a word boundary.
 */
const SAME_DAY_RE =
  /\b(?:one|single|1)\s+sitting\b|\bsame\s+day\b|\bovernight\b|\bin\s+a\s+night\b/;

const WEEKEND_RE = /\b(?:in|over)\s+(?:a|one|1)\s+weekend\b/;

/**
 * Time still ahead of the poster, not time spent. "8 weeks left" and "3 weeks
 * to go" describe a term in progress.
 */
const REMAINING_RE = /^\s*(?:left|remaining|to\s+go|away|until|out)\b/;

/**
 * The unit must sit directly after the count, which is what keeps effort
 * phrasing such as "20 study hours" out: it never reads as elapsed time.
 */
const QUANTITY_RE = new RegExp(
  String.raw`(\d{1,3}|${Object.keys(NUMBER_WORDS).join("|")})\s+(hours?|days?|weeks?|months?)\b`,
  "g",
);

export type ParsedDuration = {
  /** Whole days, rounded up: anything inside one day counts as one day. */
  days: number;
  /** The substring the number came from, for reporting and spot checks. */
  phrase: string;
};

export function parseDurationDays(title: string): ParsedDuration | null {
  const text = title.toLowerCase().replace(/[_–—]/g, " ");

  const weekend = WEEKEND_RE.exec(text);
  if (weekend) return { days: 2, phrase: weekend[0].trim() };

  const sameDay = SAME_DAY_RE.exec(text);
  if (sameDay) return { days: 1, phrase: sameDay[0].trim() };

  QUANTITY_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = QUANTITY_RE.exec(text)) !== null) {
    const [phrase, rawCount, rawUnit] = match;

    if (REMAINING_RE.test(text.slice(match.index + phrase.length))) continue;

    const count = /^\d+$/.test(rawCount)
      ? Number(rawCount)
      : NUMBER_WORDS[rawCount];
    if (!count) continue;

    const unit = rawUnit.replace(/s$/, "");
    const days = Math.ceil(count * DAYS_PER_UNIT[unit]);
    if (days < MIN_DAYS || days > MAX_DAYS) continue;

    return { days, phrase: phrase.trim() };
  }

  return null;
}

const COMPLETION_RE =
  /\b(?:passed|passing|completed|complete[ds]?|finished|finishing|done|cleared|aced|knocked\s+(?:it\s+)?out|wrapped\s+up|got\s+through|took\s+me)\b/;

/**
 * Abandonment, which makes any duration in the title a time spent *not*
 * clearing the course. Titles carrying both a failure and a pass — "failed
 * twice then passed in 20 days" — are dropped too. That loses a few honest
 * numbers, but the alternative is publishing a fail duration as a clear time.
 */
const FAILURE_RE =
  /\b(?:failed|failing|flunked|gave\s+up|withdrew|dropped\s+(?:the\s+)?(?:class|course)|did\s?n[o']t\s+pass)\b/;

/**
 * Whether a title claims the poster finished the course. A duration only means
 * "time to clear" when the post says the course was cleared.
 */
export function describesCompletion(title: string): boolean {
  const text = title.toLowerCase().replace(/[_–—]/g, " ");
  if (FAILURE_RE.test(text)) return false;
  return COMPLETION_RE.test(text);
}

/** Recovers a course code from a Reddit post title or URL slug. */
export function courseCodesInText(text: string): string[] {
  const codes = new Set<string>();
  const re = /(?:^|[^a-z0-9])([cde]\d{3})(?![0-9])/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    codes.add(match[1].toUpperCase());
  }
  return [...codes];
}
