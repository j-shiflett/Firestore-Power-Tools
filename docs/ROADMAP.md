# Roadmap

Goal: make Firestore Power Tools a **local-first alternative** to the Firestore Console for day-to-day developer workflows.

## Principles

- Default to **read-only** operations unless the user explicitly enables write mode.
- Prefer **CSV / JSONL import/export** over brittle vendor-specific integrations.
- Treat document contents as potentially sensitive; avoid logging raw values by default.

## Near-term (high leverage)

### 1) Database browser (UI)

- Collections list
- Document list w/ pagination
- Document detail view
- Quick search by doc id

### 2) Export

- Export collection to **JSONL**
- Export inferred schema to JSON

### 3) Safe edits (opt-in)

- Edit document JSON (merge write)
- Delete doc (with confirmation)
- Audit log written to a local file

## Mid-term

- Bulk operations UI (set defaults, rename/copy fields)
- Redaction helpers (mask emails/phones in UI)
- Schema diffing between two points in time (saved snapshots)
- “Dry run” + preview for bulk operations

## Long-term

- Connector framework (optional)
- Pluggable auth (OAuth) for a hosted version (if ever)
