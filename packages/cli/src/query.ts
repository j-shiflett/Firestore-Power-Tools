import type { Firestore, Query } from "@google-cloud/firestore";
import { z } from "zod";

export const WhereClause = z.object({
  field: z.string().min(1),
  op: z.enum(["==", ">", ">=", "<", "<=", "array-contains"]),
  // JSON value (parsed server-side)
  value: z.any(),
});

export const QueryRequest = z.object({
  collection: z.string().min(1),
  where: z.array(WhereClause).default([]),
  orderBy: z
    .object({
      field: z.string().min(1),
      direction: z.enum(["asc", "desc"]).default("asc"),
    })
    .optional(),
  limit: z.number().int().positive().max(200).default(25),
  startAfterId: z.string().min(1).optional(),
});

export type QueryResponse = {
  collection: string;
  docs: Array<{ id: string; data: Record<string, unknown> }>;
  nextPageToken: string | null;
};

export async function runQuery(db: Firestore, req: z.infer<typeof QueryRequest>): Promise<QueryResponse> {
  let q: Query = db.collection(req.collection);

  for (const w of req.where) {
    q = (q as any).where(w.field, w.op as any, w.value);
  }

  if (req.orderBy) {
    q = (q as any).orderBy(req.orderBy.field, req.orderBy.direction);
  } else {
    // Stable default ordering
    q = (q as any).orderBy("__name__");
  }

  if (req.startAfterId) {
    // For stability across all orderBy, use startAfter on the document snapshot when ordering by __name__,
    // otherwise attempt to startAfter the doc snapshot (Firestore will enforce ordering constraints).
    const snap = await db.collection(req.collection).doc(req.startAfterId).get();
    if (snap.exists) {
      q = (q as any).startAfter(snap);
    }
  }

  q = (q as any).limit(req.limit);

  const snap = await q.get();
  const docs = snap.docs.map((d) => ({ id: d.id, data: d.data() as any }));
  const nextPageToken = snap.docs.length ? snap.docs[snap.docs.length - 1].id : null;

  return { collection: req.collection, docs, nextPageToken };
}
