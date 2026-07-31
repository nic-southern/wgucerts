# WGU Certs Viewer

Plan how industry certifications and prior degrees may apply toward WGU School of Technology programs.

**Unofficial planning aid.** WGU’s enrollment evaluation is authoritative.

## Setup

```bash
npm install
npm run dev
```

## Scripts

| Command | Purpose |
|--------|---------|
| `npm run dev` | Dev server |
| `npm run build` | Static export → `out/` |
| `npm test` | Unit tests |
| `npm run lint` | ESLint |
| `npm run ingest` | Refresh `data/catalog` from WGU pages |

User credentials are stored only in browser `localStorage`.

See [`AGENTS.md`](AGENTS.md) and [`docs/index.md`](docs/index.md).
# wgucerts
