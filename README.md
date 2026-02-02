# Firestore Power Tools

Local-first Firestore tooling: **observed schema inference** + **safe bulk backfills/migrations**.

## Goals

- No hosted service (runs on your machine)
- Uses Google **Application Default Credentials** (ADC)
- Provides a CLI + a local web UI

## Quick start (dev)

### Prereqs

- Node.js 20+
- pnpm
- gcloud (for ADC)

### 1) Authenticate (ADC)

```bash
gcloud auth application-default login
```

### 2) Install

```bash
pnpm install
```

### 3) Run setup wizard (recommended)

```bash
pnpm --filter @fpt/cli dev -- setup
```

### 4) Run the API + get UI instructions (most memorable)

```bash
pnpm --filter @fpt/cli dev -- run
```

### 5) Run the UI (separate terminal)

```bash
pnpm --filter @fpt/ui dev
```

Then open the UI and point it at the local CLI server.

## Commands (MVP)

- `fpt setup`: interactive setup (auth + defaults)
- `fpt doctor`: sanity-check environment + Firestore access
- `fpt run` (alias: `fpt dev`): start local API + open UI (default)
- `fpt serve` (alias: `fpt up`, `fpt start`): start local API only
- `fpt infer --collection <name>`: infer observed schema (shorthand)

## Docs

- `docs/SETUP.md`
- `docs/USAGE.md`

## Notes

Firestore is schemaless. This tool infers an **observed schema** by sampling documents.

## License

MIT
