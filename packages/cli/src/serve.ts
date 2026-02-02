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

  app.listen(opts.port, "127.0.0.1", () => {
    // eslint-disable-next-line no-console
    console.log(`fpt server listening on http://127.0.0.1:${opts.port}`);
  });
}
