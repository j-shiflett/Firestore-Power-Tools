import express from "express";
import cors from "cors";
import { z } from "zod";
import { getFirestore } from "./firestore.js";
import { inferSchema } from "./schema/infer.js";
import { writeCsv, writeJsonl } from "./export.js";
import { QueryRequest, runQuery } from "./query.js";
import { assertWriteEnabled } from "./write.js";

export async function serve(opts: { projectId: string; port: number; writeEnabled?: boolean; writeToken?: string }) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "2mb" }));

  const db = getFirestore(opts.projectId);
  const idFieldPath = "__name__"; // documentId

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.get("/collections", async (_req, res) => {
    const cols = await db.listCollections();
    res.json({ collections: cols.map((c) => c.id).sort() });
  });

  app.get("/schema/infer", async (req, res) => {
    const q = z
      .object({
        collection: z.string().min(1),
        limit: z.coerce.number().int().positive().max(5000).optional(),
      })
      .parse(req.query);

    const out = await inferSchema({
      projectId: opts.projectId,
      collection: q.collection,
      limit: q.limit ?? 200,
    });

    res.json(out);
  });

  // Document browser (read-only)
  app.get("/docs", async (req, res) => {
    const q = z
      .object({
        collection: z.string().min(1),
        limit: z.coerce.number().int().positive().max(500).optional(),
        startAfter: z.string().min(1).optional(),
      })
      .parse(req.query);

    let ref = db.collection(q.collection).orderBy(idFieldPath).limit(q.limit ?? 25);
    if (q.startAfter) {
      ref = ref.startAfter(q.startAfter);
    }

    const snap = await ref.get();
    const docs = snap.docs.map((d) => ({ id: d.id, data: d.data() }));
    const nextPageToken = snap.docs.length ? snap.docs[snap.docs.length - 1].id : null;

    res.json({
      collection: q.collection,
      docs,
      nextPageToken,
    });
  });

  app.get("/doc", async (req, res) => {
    const q = z
      .object({
        collection: z.string().min(1),
        id: z.string().min(1),
      })
      .parse(req.query);

    const snap = await db.collection(q.collection).doc(q.id).get();
    if (!snap.exists) return res.status(404).json({ error: "not_found" });
    res.json({ id: snap.id, data: snap.data() });
  });

  app.get("/query", async (req, res) => {
    // where is passed as a JSON string in querystring for convenience.
    const raw = z
      .object({
        collection: z.string().min(1),
        where: z.string().optional(),
        orderByField: z.string().optional(),
        orderByDir: z.enum(["asc", "desc"]).optional(),
        limit: z.coerce.number().optional(),
        startAfterId: z.string().optional(),
      })
      .parse(req.query);

    const where = raw.where ? JSON.parse(raw.where) : [];
    const out = await runQuery(
      db,
      QueryRequest.parse({
        collection: raw.collection,
        where,
        orderBy: raw.orderByField
          ? { field: raw.orderByField, direction: raw.orderByDir ?? "asc" }
          : undefined,
        limit: raw.limit ?? 25,
        startAfterId: raw.startAfterId,
      })
    );

    res.json(out);
  });

  // Write mode (opt-in) - edit / delete
  app.patch("/doc", async (req, res) => {
    try {
      assertWriteEnabled(opts, req);
    } catch (e: any) {
      return res.status(e?.status ?? 401).json({ error: e?.message ?? "write_not_allowed" });
    }

    const q = z
      .object({
        collection: z.string().min(1),
        id: z.string().min(1),
      })
      .parse(req.query);

    const body = z.object({ data: z.record(z.any()) }).parse(req.body);

    await db.collection(q.collection).doc(q.id).set(body.data, { merge: true });
    res.json({ ok: true });
  });

  app.delete("/doc", async (req, res) => {
    try {
      assertWriteEnabled(opts, req);
    } catch (e: any) {
      return res.status(e?.status ?? 401).json({ error: e?.message ?? "write_not_allowed" });
    }

    const q = z
      .object({
        collection: z.string().min(1),
        id: z.string().min(1),
      })
      .parse(req.query);

    await db.collection(q.collection).doc(q.id).delete();
    res.json({ ok: true });
  });

  // Export (read-only)
  app.get("/export", async (req, res) => {
    const q = z
      .object({
        collection: z.string().min(1),
        format: z.enum(["jsonl", "csv"]).default("jsonl"),
        limit: z.coerce.number().int().positive().max(5000).optional(),
        startAfter: z.string().min(1).optional(),
        // CSV columns (top-level) - optional. If not provided, inferred from exported rows.
        columns: z.string().optional(),
      })
      .parse(req.query);

    const limit = q.limit ?? 1000;

    let ref = db.collection(q.collection).orderBy(idFieldPath).limit(limit);
    if (q.startAfter) {
      ref = ref.startAfter(q.startAfter);
    }

    const snap = await ref.get();
    const rows = snap.docs.map((d) => ({ id: d.id, data: d.data() as any }));

    const filename = `firestore-${q.collection}-${new Date().toISOString().slice(0, 10)}.${q.format}`;
    res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`);

    if (q.format === "csv") {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      const cols = q.columns ? q.columns.split(",").map((s) => s.trim()).filter(Boolean) : undefined;
      writeCsv(res, rows, cols);
      return res.end();
    }

    res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
    writeJsonl(res, rows);
    return res.end();
  });

  app.listen(opts.port, "127.0.0.1", () => {
    // eslint-disable-next-line no-console
    console.log(`fpt server listening on http://127.0.0.1:${opts.port}`);
  });
}
