import { spawn } from "node:child_process";
import readline from "node:readline/promises";
import process from "node:process";

import { getFirestore } from "./firestore.js";
import { getConfigPath, loadConfig, saveConfig } from "./config.js";
import { generateWriteToken } from "./write.js";

async function getGcloudDefaultProject(): Promise<string> {
  return await new Promise((resolve) => {
    const p = spawn("gcloud", ["config", "get-value", "project"], {
      stdio: ["ignore", "pipe", "ignore"],
    });
    let out = "";
    p.stdout?.on("data", (d) => (out += String(d)));
    p.on("error", () => resolve(""));
    p.on("exit", (code) => {
      if (code !== 0) return resolve("");
      const v = out.trim();
      // gcloud prints "(unset)" sometimes
      if (!v || v === "(unset)") return resolve("");
      resolve(v);
    });
  });
}

async function commandExists(cmd: string): Promise<boolean> {
  return new Promise((resolve) => {
    const p = spawn(cmd, ["--version"], { stdio: "ignore" });
    p.on("error", () => resolve(false));
    p.on("exit", (code) => resolve(code === 0));
  });
}

async function runInteractive(cmd: string, args: string[]) {
  await new Promise<void>((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: "inherit" });
    p.on("error", reject);
    p.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

function yn(s: string) {
  return ["y", "yes"].includes(String(s).trim().toLowerCase());
}

export async function setupWizard() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const existing = await loadConfig();

    // 1) gcloud check
    const hasGcloud = await commandExists("gcloud");
    if (!hasGcloud) {
      process.stderr.write(
        [
          "gcloud CLI not found.",
          "Install it first:",
          "  https://cloud.google.com/sdk/docs/install",
          "Then re-run: fpt setup",
        ].join("\n") + "\n"
      );
      process.exitCode = 2;
      return;
    }

    // 2) ADC auth
    process.stdout.write("This tool uses Application Default Credentials (ADC).\n");
    const doAuth = await rl.question("Run `gcloud auth application-default login` now? (y/N) ");
    if (yn(doAuth)) {
      await runInteractive("gcloud", ["auth", "application-default", "login"]);
    } else {
      process.stdout.write(
        "Skipping auth. If commands fail with permission errors, run:\n  gcloud auth application-default login\n"
      );
    }

    // 3) Project id
    const gcloudProject = await getGcloudDefaultProject();
    const defaultProject = existing.projectId ?? gcloudProject ?? "";
    const projectId =
      (await rl
        .question(`GCP project id${defaultProject ? ` [${defaultProject}]` : ""}: `))
        .trim() || defaultProject;
    if (!projectId) {
      process.stderr.write("Project id is required.\n");
      process.exitCode = 2;
      return;
    }

    // 4) Port
    const defaultPort = String(existing.port ?? 4011);
    const portRaw = (await rl.question(`Local server port [${defaultPort}]: `)).trim() || defaultPort;
    const port = Number(portRaw);
    if (!Number.isFinite(port) || port <= 0 || port > 65535) {
      process.stderr.write("Invalid port.\n");
      process.exitCode = 2;
      return;
    }

    // 5) quick permission check
    process.stdout.write("Checking Firestore access (listCollections)...\n");
    try {
      const db = getFirestore(projectId);
      await db.listCollections();
      process.stdout.write("OK: Firestore access looks good.\n");
    } catch (e: any) {
      process.stdout.write(
        [
          "Could not verify Firestore access.",
          "This may be fine if Firestore API is disabled or your account lacks permissions.",
          `Error: ${e?.message ?? String(e)}`,
        ].join("\n") + "\n"
      );
    }

    // 6) write mode (optional)
    const enableWrite = await rl.question("Enable WRITE mode (edit/delete docs)? (y/N) ");
    let writeEnabled = existing.writeEnabled ?? false;
    let writeToken = existing.writeToken;
    if (["y", "yes"].includes(String(enableWrite).trim().toLowerCase())) {
      writeEnabled = true;
      writeToken = generateWriteToken();
      process.stdout.write("\nWRITE MODE ENABLED. Keep this token secret:\n");
      process.stdout.write(`  X-FPT-Write-Token: ${writeToken}\n\n`);
    }

    await saveConfig({
      ...existing,
      projectId,
      port,
      serverHost: existing.serverHost ?? "127.0.0.1",
      writeEnabled,
      writeToken,
    });

    process.stdout.write(
      [
        "\nSaved config:",
        `  ${getConfigPath()}`,
        "\nNext:",
        "  fpt run",
        "  (then start the UI: pnpm --filter @fpt/ui dev)",
      ].join("\n") + "\n"
    );
  } finally {
    rl.close();
  }
}
