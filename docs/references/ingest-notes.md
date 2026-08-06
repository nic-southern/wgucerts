# Catalog ingest notes

## Current

- `npm run ingest` writes `data/catalog/catalog.json` from these WGU sources:
  | Source | Gives us |
  |---|---|
  | Partner transfer-guideline endpoints | live program list, cert → course clears, non-transferable courses |
  | Institutional Catalog PDF | course tables (codes + competency units) |
  | Transferable Certifications page | providers, certificates, program eligibility |
  | Sophia College of IT chart | Sophia/Study.com course clears |
  | Curated table + Reddit search | community clear times per course |
- A CU (competency unit) is WGU’s semester credit-hour equivalent.
- **Reverse clears:** each WGU course can list certs (`certCourseClears`) and Sophia/Study.com courses (`transferCourseClears`).
- Sophia seeds come from the WGU College of IT Sophia chart; Study.com is a thinner starter pack. Always confirm on [WGU Transfer Pathways](https://partners.wgu.edu/).

### Which programs we publish

The program list comes from the same endpoints that back
[partners.wgu.edu](https://partners.wgu.edu/general-transfer-guidelines), filtered to the
`Approved` catalog revision of each degree. That is the set the partner site offers, so a
new catalog going live is picked up without a code change. The earlier list came from the
Transferable Certifications page, which still names degrees WGU has retired.

Course tables come from the institutional catalog, matched to a program by WGU's program
code. Two Software Engineering tracks share a catalog heading word for word, so they are
told apart by a course only one track lists. Ingest fails if a program has no course table
rather than publishing an empty program.

### Cert → course clears

Guidelines state per course what WGU accepts ("One course equivalent to 3 units in Linux
foundations … or one of the following certifications: CompTIA: Linux+; LPI: Linux
Essentials, LPIC-1 …"). A rule names the programs it applies to, and the same course can be
treated differently in each: `D522` is non-transferable in the Cloud and Network Engineering
programs but transferable in Cybersecurity. Clears therefore carry `programIds`, and the
reverse lookup and match engine both filter on the selected program.

`cert-match.ts` resolves a name written in prose to a certificate record by reducing both
to key sets (name, parenthesized acronym, plus-suffixed token, vendor exam code). Keys are
whole tokens, so `Data+` cannot match `A+` — an earlier regex version did.

Every run prints coverage and **every certification name WGU states that we could not
match**. Treat a growing unresolved list as the signal to extend the vendor aliases; the
last coverage gap went unnoticed because nothing reported it. What remains unresolved is
mostly credentials absent from the Transferable Certifications page, so there is no record
to match them to.

### Community clear times

`courseTimes` answers "how long did this take other people," merged from two sources:

1. **`course-time-seed.ts`** — a hand-reviewed row per source post. This is the baseline, so
   a blocked search degrades to reviewed data rather than to nothing.
2. **Reddit search** — `reddit-search.ts` reads the HTML search page across the WGU
   subreddits. The JSON endpoints refuse unauthenticated clients; the HTML page is a
   courtesy, not a supported interface, so it is cached for a week, rate-limited, and
   abandoned on a 429. `INGEST_SKIP_REDDIT=1` turns it off.

A duration is only read from phrasings we can defend (`parse-duration.ts`); anything else is
counted as no data and printed. Four filters exist because each caught real bad data on the
first run:

- the title must claim a pass, or a duration spent failing reads as a clear time
- "8 weeks left" is time remaining, not time spent (it gave `C683` 56 days)
- a title naming three or more courses is a term or degree summary, not a course report (a
  BSCSIA master list gave 159 days to every course it named)
- a crossposted title arrives under two URLs and counted as two students

Aggregation stores the **median**, not the mean: these distributions have long right tails.
The report count travels with every estimate because most courses have one report, and
people post when a course went quickly. Ingest re-checks each curated row against the code
its cited post names — that check is what caught two rows whose times belonged to other
courses.

Each report carries the day it was posted, so a reader can tell a course rewritten last
year from an account written five years ago. Reports list newest first and the UI shows only
the first few, so the date decides what a reader sees. Curated rows store no date of their
own: `parsePostDates` indexes every result on the search pages already in the cache,
including those the report filters reject, which dates most rows without another request.
A row nothing links to stays undated and the UI omits the date rather than guessing.

One thread can serve several courses. The thread on the new BSIT courses gives a duration
for `E005` and task detail with no duration for `E006`, `E007`, and `E008`, so it appears
under all four — three of them as a link with no number.

### Fetching

- Endpoints and the program college code live in `scripts/ingest/partner-api.ts`; responses
  are parsed with Zod so a shape change fails the run instead of writing junk.
- WGU's asset host rejects unfamiliar user agents and rate-limits bursts, so ingest sends a
  browser user agent, waits between requests, and falls back to the cached text in
  `data/catalog/*.txt` when a PDF fetch fails.

## Later

- Schedule ingest via GitHub Actions (weekly) with a PR or commit of refreshed `data/catalog/catalog.json`.
- Use the published per-program course lists for prior associate degrees in place of the
  category-based `degreeRules` (today those rules clear gen-ed categories but
  `excludesCourseIds` skips courses WGU marks as not degree-satisfiable, e.g. D333).
  WGU publishes no equivalent list for a prior bachelor's.
- Add Sophia / Study.com packs using the same catalog shapes.
