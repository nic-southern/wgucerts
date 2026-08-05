# Progress and Clear Times v2

## Intent

Turn the viewer from "what could transfer" into "how far along am I, and how much work is left." A planner marks off what they have finished — whether transferred in or passed at WGU — sees a percentage of the degree complete, and sees how long each remaining course has taken other students.

## Users

Same as v1: anyone on the public web, no accounts, everything kept in the browser.

## Scope

**In**

- Mark any course complete, whether cleared by transfer or passed at WGU
- Mark Sophia / Study.com courses finished; the WGU courses they map to become complete
- Percent of degree complete, measured in competency units
- Community-reported clear time per course, with report count and source links
- Estimated coursework remaining, summed from those times
- Build-time ingest of clear times from a committed curated table plus Reddit search results

**Out**

- Accounts, sync, server storage
- Any request-time fetch of Reddit or WGU
- Presenting a community estimate as an official or guaranteed pace
- Predicting a graduation date or term schedule

## Completion model

A course counts as complete when **any** of the following hold:

1. The planner marked it complete directly.
2. A held certificate clears it under a published rule for the selected program.
3. The prior-degree rules clear it.
4. A Sophia / Study.com course that maps to it is marked finished.

Percent complete is competency units, not course count, because courses range from 1 to 6 CUs and a course-count percentage would misstate progress. Both the percentage and the CU totals are shown, so the figure is checkable.

Completion is scoped to the selected program. A course marked complete stays marked when the planner switches programs; if the new program does not include that course, it simply does not count toward that program's total.

## Clear-time data

### Sources

Two sources, merged at build time into the committed catalog:

1. **Curated table** — a hand-maintained file of course code, day count, and source URL. This is the trusted baseline; it is reviewed by a human and safe to edit by hand.
2. **Reddit search** — ingest searches for each course code and parses day counts out of post titles.

Neither source is fetched at request time. The UI only reads the committed catalog, per the v1 rule.

### Duration parsing

Post titles state elapsed time in inconsistent ways. Ingest normalizes to whole days:

| Title phrasing | Days |
| --- | --- |
| "in 3 hours", "in one sitting", "same day" | 1 |
| "in a day", "in 1 day" | 1 |
| "in 8 days" | 8 |
| "in 2 weeks" | 14 |
| "in a month", "in 1 month" | 30 |

Anything not matching a known phrasing is **not** guessed. It is counted as no data and printed at the end of the ingest run, the same way unresolved certificate names are reported today, so gaps stay visible instead of silently degrading.

### Aggregation

Per course, the catalog stores the report count, the median day count, the lowest and highest reported, and the source posts. The median is used rather than the mean because self-reported times are heavily right-skewed by a few very long reports.

Each source post carries the month it was posted, and reports are listed newest first. Courses get rewritten and assessments get replaced, so recency is part of judging whether an account still applies. A post with no date available shows none.

### Known data hazards

- **Self-selection.** People post when they pass fast. These numbers skew optimistic and the copy must not imply a typical pace.
- **Mis-cited sources.** The curated table's `D683` row cited a post about `C683`, and `D459` cited a post about `D335`. Both times are dropped rather than imported. Ingest flags any curated row whose source URL names a different course code.
- **Renumbered courses.** WGU reuses names across codes; two distinct courses both named "Fundamentals of Information Security" carry very different reported times. Times are keyed by course code, never by name.
- **Single-report courses.** Most courses have exactly one report. The report count is always shown so a reader can weigh it.

## Honesty

This section governs the copy, and it matters more here than anywhere else in the product, because a number next to a course reads as a promise.

- Times are labelled as reported by other students, with the report count visible and the source post linked.
- A course with no reports reads as having no reports yet. It never reads as zero days.
- Marking a course complete hides none of its reports. The accounts are the only record of where its time came from, and a finished course still has a completed neighbour who wrote about it. A completed course with no reports says nothing rather than reading as a gap.
- The summed estimate always states how many remaining courses have no reports, so it cannot be mistaken for a complete total.
- No graduation date, no "you will finish in", no implied guarantee of pace.
- v1's framing still holds: unofficial planning aid, WGU enrollment evaluation is authoritative.

## Storage

The stored profile gains the list of courses marked complete and the list of Sophia / Study.com courses marked finished. This is a breaking shape change, so the key version increments and the previous version is read once and migrated forward, preserving certificates and prior degree. A planner who used v1 loses nothing.

## Success

A planner picks BS Information Technology, checks off the Sophia courses they finished and the WGU courses they passed, and sees the percentage of the degree done, the competency units behind that percentage, and for each remaining course how long it took other students — with the report count and a link to read the source themselves.
