# WGU Certs Viewer

Public planning aid for WGU School of Technology programs: browse courses, store credentials in the browser, and match transfer eligibility from build-time catalog data.

## Commands

| Command | Purpose |
|--------|---------|
| `npm run dev` | Local Next.js dev server |
| `npm run build` | Static export to `out/` |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests |
| `npm run ingest` | Refresh catalog JSON from WGU pages |

## Where things live

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — domains, boundaries, dependency direction
- [`docs/index.md`](docs/index.md) — docs entry
- [`docs/product-specs/`](docs/product-specs/) — product intent
- [`data/catalog/`](data/catalog/) — committed catalog snapshot (source of truth for the app)
- [`scripts/ingest/`](scripts/ingest/) — WGU fetch/parse → catalog JSON
- [`src/lib/`](src/lib/) — schemas, catalog loaders, match engine, profile store
- [`src/app/`](src/app/) — UI routes

## Rules of the road

- **No runtime scrape** — UI only reads committed `data/catalog`.
- **Parse at boundaries** — Zod for catalog JSON and localStorage profile.
- **User data stays local** — `localStorage` key `wgucerts.profile.v1`; no accounts.
- **Honest copy** — unofficial planning aid; never claim official WGU evaluation.
- Keep this file short; put detail in `docs/` or `ARCHITECTURE.md`.
