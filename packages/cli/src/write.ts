import crypto from "node:crypto";
import type { Request } from "express";

export function generateWriteToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

export function assertWriteEnabled(opts: { writeEnabled?: boolean; writeToken?: string }, req: Request) {
  if (!opts.writeEnabled || !opts.writeToken) {
    const err: any = new Error("write_disabled");
    err.status = 403;
    throw err;
  }

  const token = req.header("X-FPT-Write-Token") ?? "";
  if (!token || token !== opts.writeToken) {
    const err: any = new Error("invalid_write_token");
    err.status = 401;
    throw err;
  }
}
