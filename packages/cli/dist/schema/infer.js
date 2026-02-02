import { z } from "zod";
import { getFirestore } from "../firestore.js";
const InferArgs = z.object({
    projectId: z.string().min(1),
    collection: z.string().min(1),
    limit: z.number().int().positive().max(5000).default(200),
});
function bump(stats, t) {
    stats.present += 1;
    stats.types[t] = (stats.types[t] ?? 0) + 1;
}
function typeOfValue(v) {
    if (v === null)
        return "null";
    if (typeof v === "boolean")
        return "boolean";
    if (typeof v === "number")
        return "number";
    if (typeof v === "string")
        return "string";
    // Firestore Timestamp has toDate()
    if (typeof v === "object" && v && "toDate" in v)
        return "timestamp";
    // Bytes has toBase64()
    if (typeof v === "object" && v && "toBase64" in v)
        return "bytes";
    // DocumentReference has path
    if (typeof v === "object" && v && "path" in v && "id" in v)
        return "reference";
    // GeoPoint has latitude/longitude
    if (typeof v === "object" && v && "latitude" in v && "longitude" in v)
        return "geoPoint";
    if (Array.isArray(v))
        return "array";
    if (typeof v === "object")
        return "map";
    return "unknown";
}
function walk(prefix, obj, out) {
    if (!obj || typeof obj !== "object" || Array.isArray(obj))
        return;
    for (const [k, v] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${k}` : k;
        const t = typeOfValue(v);
        out[path] ??= { present: 0, types: {} };
        bump(out[path], t);
        if (t === "map")
            walk(path, v, out);
    }
}
export async function inferSchema(args) {
    const { projectId, collection, limit } = InferArgs.parse(args);
    const db = getFirestore(projectId);
    const snap = await db.collection(collection).limit(limit).get();
    const fields = {};
    for (const doc of snap.docs) {
        walk("", doc.data(), fields);
    }
    return {
        collection,
        sampleSize: snap.size,
        fields,
    };
}
