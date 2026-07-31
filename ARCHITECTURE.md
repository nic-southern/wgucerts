# Architecture

## Domains

| Domain | Responsibility |
|--------|----------------|
| **Ingest** | Fetch WGU pages, parse into typed catalog JSON |
| **Catalog** | Static programs, courses, providers, certificates, eligibility |
| **Profile** | Browser-local credentials, completed courses, and selected program |
| **Match** | Pure functions: profile + catalog → cleared / remaining / progress / applicable certs |
| **UI** | Next.js static routes that compose the above |

## Dependency direction

```text
scripts/ingest  →  data/catalog/*.json
data/catalog    →  src/lib/catalog  →  src/lib/match  →  src/app (UI)
src/lib/profile →  src/lib/match  →  src/app (UI)
```

UI must never import ingest scrapers or fetch WGU at request time.

## Boundaries

- **Catalog JSON** — validated with Zod (`src/lib/catalog/schema.ts`) when loaded.
- **localStorage** — validated with Zod (`src/lib/profile/schema.ts`) on read; invalid data resets to defaults.
- **Match engine** — pure; no I/O.

## External IO

| Source | When | Output |
|--------|------|--------|
| WGU transferable certifications page | `npm run ingest` | providers, certificates, program eligibility |
| WGU partner transfer guidelines | `npm run ingest` | programs, cert → course clears, non-transferable courses |
| WGU institutional catalog | `npm run ingest` | courses, competency units |
| Reddit search (best effort) | `npm run ingest` | community clear times |
| Browser localStorage | runtime (client) | user profile |

Periodic refresh via GitHub Actions is planned later; v1 is manual `npm run ingest`.
