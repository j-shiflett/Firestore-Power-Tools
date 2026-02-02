import type { Response } from "express";

export type ExportRow = { id: string; data: Record<string, unknown> };

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  let s = typeof v === "string" ? v : JSON.stringify(v);
  // Normalize newlines
  s = s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (/[\n",]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function writeJsonl(res: Response, rows: ExportRow[]) {
  for (const row of rows) {
    res.write(JSON.stringify({ id: row.id, ...row.data }) + "\n");
  }
}

export function writeCsv(res: Response, rows: ExportRow[], columns?: string[]) {
  const cols = columns && columns.length ? columns : inferTopLevelColumns(rows);
  res.write(["id", ...cols].join(",") + "\n");
  for (const row of rows) {
    const rec: Record<string, unknown> = row.data ?? {};
    const line = [csvEscape(row.id), ...cols.map((c) => csvEscape(rec[c]))].join(",");
    res.write(line + "\n");
  }
}

function inferTopLevelColumns(rows: ExportRow[]): string[] {
  const set = new Set<string>();
  for (const r of rows) {
    for (const k of Object.keys(r.data ?? {})) set.add(k);
  }
  return Array.from(set).sort();
}
