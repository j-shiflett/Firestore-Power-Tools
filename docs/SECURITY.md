# Security

## Data handling

Firestore data can contain sensitive information. This project is designed to be **local-first**.

- Uses **ADC** (no service account keys stored by this tool)
- Runs on `127.0.0.1` by default
- Avoids logging document contents by default

## Tokens

Do not commit tokens to the repo.
If you use GitHub Personal Access Tokens for pushes, treat them like passwords and revoke them when done.

## Write operations

Write mode is **disabled by default**.

To enable it:
- Run `fpt setup` and answer yes to write mode
- The wizard will generate a `writeToken`
- The UI/API will require `X-FPT-Write-Token` for writes

Any document edit/delete features should:
- require explicit opt-in
- show a clear confirmation
- create a local audit log (coming next)
