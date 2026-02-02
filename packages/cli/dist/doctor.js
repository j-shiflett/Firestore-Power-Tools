import { spawn } from "node:child_process";
import process from "node:process";
import { getFirestore } from "./firestore.js";
import { loadConfig } from "./config.js";
async function commandExists(cmd) {
    return new Promise((resolve) => {
        const p = spawn(cmd, ["--version"], { stdio: "ignore" });
        p.on("error", () => resolve(false));
        p.on("exit", (code) => resolve(code === 0));
    });
}
async function execCapture(cmd, args) {
    return await new Promise((resolve) => {
        const p = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
        let out = "";
        p.stdout?.on("data", (d) => (out += String(d)));
        p.on("error", () => resolve({ ok: false, stdout: "" }));
        p.on("exit", (code) => resolve({ ok: code === 0, stdout: out.trim() }));
    });
}
function line(ok, label, detail) {
    const mark = ok ? "OK" : "FAIL";
    process.stdout.write(`${mark.padEnd(4)} ${label}${detail ? ` — ${detail}` : ""}\n`);
}
export async function doctor(args) {
    process.stdout.write("Firestore Power Tools — doctor\n\n");
    const cfg = await loadConfig();
    const projectId = args.projectId ?? cfg.projectId;
    // 1) gcloud
    const hasGcloud = await commandExists("gcloud");
    line(hasGcloud, "gcloud installed");
    // 2) ADC creds file exists
    const adc = await execCapture("gcloud", ["auth", "application-default", "print-access-token"]);
    line(adc.ok, "ADC auth", adc.ok ? "token OK" : "run: gcloud auth application-default login");
    // 3) project id
    const hasProject = !!projectId;
    line(hasProject, "project id", hasProject ? projectId : "run: fpt setup (or pass --project)");
    // 4) Firestore permission
    if (projectId) {
        try {
            const db = getFirestore(projectId);
            await db.listCollections();
            line(true, "Firestore access", "listCollections OK");
        }
        catch (e) {
            line(false, "Firestore access", e?.message ?? String(e));
        }
    }
    // 5) Suggested URLs
    const port = args.port ?? cfg.port ?? 4011;
    const uiUrl = args.uiUrl ?? "http://127.0.0.1:5173";
    process.stdout.write("\nSuggested:\n");
    process.stdout.write(`  API: http://127.0.0.1:${port}\n`);
    process.stdout.write(`  UI:  ${uiUrl}\n`);
    process.stdout.write("\nIf something failed:\n");
    process.stdout.write("  1) fpt setup\n");
    process.stdout.write("  2) pnpm --filter @fpt/ui dev\n");
    process.stdout.write("  3) fpt run\n");
}
