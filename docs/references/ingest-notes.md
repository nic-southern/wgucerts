# Catalog ingest notes

## Current

- `npm run ingest` writes `data/catalog/catalog.json` from these WGU sources:
  | Source | Gives us |
  |---|---|
  | Partner transfer-guideline endpoints | live program list, cert → course clears, non-transferable courses |
  | Institutional Catalog PDF | course tables (codes + competency units) |
  | Transferable Certifications page | providers, certificates, program eligibility |
  | Sophia College of IT chart | Sophia/Study.com course clears |
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

### Fetching

- Endpoints and the program college code live in `scripts/ingest/partner-api.ts`; responses
  are parsed with Zod so a shape change fails the run instead of writing junk.
- WGU's asset host rejects unfamiliar user agents and rate-limits bursts, so ingest sends a
  browser user agent, waits between requests, and falls back to the cached text in
  `data/catalog/*.txt` when a PDF fetch fails.

## Later

- Schedule ingest via GitHub Actions (weekly) with a PR or commit of refreshed `data/catalog/catalog.json`.
- Use the published per-program course lists for prior associate degrees in place of the
  category-based `degreeRules`. WGU publishes no equivalent list for a prior bachelor's.
- Add Sophia / Study.com packs using the same catalog shapes.
