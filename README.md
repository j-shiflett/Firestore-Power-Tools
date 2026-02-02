# Firestore Power Tools (Open Source)

Local-first **Google Cloud Firestore** tooling (CLI + Web UI) for developers who are tired of writing one-off scripts.

It helps you understand what’s actually in your Firestore collections and safely evolve data over time.

Local-first **Google Cloud Firestore** tooling (CLI + Web UI) for:
- **Firestore schema inference** (observed schema from sampled documents)
- **Firestore admin utilities** (safe bulk backfills / migrations — coming next)

Keywords: Firestore admin, Firestore schema, Firestore migration, Firestore tooling, GCP Firebase Firestore.

## Why this exists

Firestore is schemaless. In real projects you still need to answer:
- “What fields does this collection *actually* have?”
- “What types do we *actually* store?”
- “How do I safely backfill/rename fields without writing one-off scripts every time?”

This project is an open-source, local-first set of tools to make that easier.

## Goals

- **Local-only**: no hosted service (runs on your machine)
- **Secure by default**: uses Google **Application Default Credentials (ADC)** (no service account keys)
- **Developer-friendly**: CLI + local Web UI

## Quick start (local)

### Prereqs

- Node.js 20+
- pnpm
- Google Cloud SDK (**gcloud**)
- A GCP project with Firestore enabled + permissions

### 1) Authenticate (ADC)

```bash
gcloud auth application-default login
```

### 2) Install dependencies

```bash
pnpm install
```

### 3) Run setup wizard

```bash
pnpm --filter @fpt/cli dev -- setup
```

### 4) Start the API (and open the UI)

```bash
pnpm --filter @fpt/cli dev -- run
```

### 5) Start the UI dev server (separate terminal)

```bash
pnpm --filter @fpt/ui dev
```

Then your browser will open the UI and you can connect to the local API.

## Commands (MVP)

- `fpt setup`: interactive setup (auth + defaults)
- `fpt doctor`: sanity-check environment + Firestore access
- `fpt run` (alias: `fpt dev`): start local API + open UI (default)
- `fpt serve` (alias: `fpt up`, `fpt start`): start local API only
- `fpt infer --collection <name>`: infer observed schema (shorthand)

## Docs

- `docs/SETUP.md`
- `docs/USAGE.md`

## Current features

- List collections in a project (via local API)
- Infer an **observed schema** from a sampled set of documents
  - field paths (dot notation)
  - observed types (string/number/map/array/etc.)
  - type drift detection (same field appears with multiple types)

### Example output

```json
{
  "collection": "users",
  "sampleSize": 200,
  "fields": {
    "email": { "present": 200, "types": { "string": 200 } },
    "profile.firstName": { "present": 198, "types": { "string": 198 } },
    "profile.lastName": { "present": 198, "types": { "string": 198 } },
    "createdAt": { "present": 200, "types": { "timestamp": 200 } },
    "marketingOptIn": { "present": 172, "types": { "boolean": 172 } },
    "tags": { "present": 40, "types": { "array": 40 } }
  }
}
```

## Roadmap (near-term)

- Bulk operations (safe backfills)
  - set defaults if missing
  - rename/copy fields
  - simple transforms
- Better UI schema viewer (tables, filters, export)

## Notes

Firestore is schemaless. This tool infers an **observed schema** by sampling documents.
Sampling performs reads (billable).

## License

MIT
