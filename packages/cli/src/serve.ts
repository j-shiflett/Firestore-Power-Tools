import express from "express";
import cors from "cors";
import { z } from "zod";
import { getFirestore } from "./firestore.js";
import { inferSchema } from "./schema/infer.js";

export async function serve(opts: { projectId: string; port: number }) {
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

  app.listen(opts.port, "127.0.0.1", () => {
    // eslint-disable-next-line no-console
    console.log(`fpt server listening on http://127.0.0.1:${opts.port}`);
  });
}
