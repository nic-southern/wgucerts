# WGU Certs Viewer v1

## Intent

Help prospective WGU School of Technology students see how industry certifications and prior degrees may apply toward a bachelor’s program.

## Users

Anyone on the public web. No accounts. Credentials stay in the browser.

## Scope

**In**

- Browse IT/CS (School of Technology) bachelor’s programs and courses
- Add prior degree: none / associates / associates IT / bachelor’s
- Add certificates via provider → certificate picker
- Match: gen-ed/foundations from degree rules; program eligibility from WGU transferable-certs data; course clears when published maps exist
- Per-course reverse lookup: which certs and Sophia / Study.com options may clear it
- Build-time ingest from WGU; committed catalog snapshot

**Out**

- Live scrape at request time
- Accounts, sync, server DB
- Claiming official CU awards without published course-level sources

## Honesty

UI copy must state this is an unofficial planning aid. WGU enrollment evaluation is authoritative. Note ~5-year certification freshness where WGU states it.

## Success

A visitor can pick BS Information Technology, add CompTIA A+ and Network+, mark an associates degree, and see gen-ed knockouts plus which certs apply to that program.
