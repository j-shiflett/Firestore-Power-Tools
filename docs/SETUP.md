# Setup (Local-only)

Firestore Power Tools is **local-first**: it runs on your machine and uses your Google identity via **Application Default Credentials (ADC)**.

## Requirements

- Node.js 20+
- pnpm
- gcloud CLI
- Firestore project access (IAM)

## 1) Install gcloud

Follow Google's official docs:
- https://cloud.google.com/sdk/docs/install

## 2) Authenticate (ADC)

```bash
gcloud auth application-default login
```

This stores credentials locally and lets the Firestore SDK authenticate without storing service account keys.

## 3) Run the wizard

```bash
fpt setup
```

It will:
- confirm gcloud is installed
- optionally run ADC login
- ask for your GCP project id
- save config to `~/.fpt/config.json`

## 4) Start the API + UI

Terminal A:

```bash
fpt run
```

Terminal B:

```bash
pnpm --filter @fpt/ui dev
```

## Common issues

### Permission errors

If you see permission errors, ensure your Google account has Firestore permissions on the project.
As a quick test:

```bash
fpt doctor
```

### Firestore API disabled

Some projects may not have Firestore enabled (or may be in Datastore mode).

### Cost / quotas

Schema inference reads documents. Start with small sample sizes (e.g. 50–200).
