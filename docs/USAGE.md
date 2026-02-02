# Usage

## Quick commands

- `fpt setup` — interactive setup
- `fpt doctor` — verify environment + permissions
- `fpt run` / `fpt dev` — start local API + open UI
- `fpt serve` / `fpt up` — start local API only
- `fpt infer --collection <name>` — infer observed schema (JSON)

## How schema inference works

Firestore is schemaless.

This tool infers an **observed schema** by sampling documents from a collection and recording:
- which fields appear
- which types were observed
- nested map field paths (dot notation)

## Safety notes

- Sampling reads documents (billable reads).
- Treat example values as sensitive; consider adding redaction later.
