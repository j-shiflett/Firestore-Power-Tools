# Architecture

## Overview

This project is split into two parts:

- **CLI / Local API server** (`packages/cli`)
  - Auth via **Application Default Credentials (ADC)**
  - Talks directly to Firestore
  - Exposes a small HTTP API on `127.0.0.1` for the UI

- **Web UI** (`packages/ui`)
  - Vue 3 + PrimeVue
  - Calls the local API server

## Why a local API server?

- Keeps credentials and direct Firestore access on the developer machine.
- Lets the UI stay thin and portable.
- Avoids embedding Google auth flows in the browser.

## Safety

- The API binds to `127.0.0.1` by default.
- Write operations should be gated behind explicit user opt-in.
