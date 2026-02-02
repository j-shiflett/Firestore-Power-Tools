#!/usr/bin/env node

import { Command } from "commander";
import { serve } from "./serve.js";
import { inferSchema } from "./schema/infer.js";
import { loadConfig } from "./config.js";
import { setupWizard } from "./setup.js";
import { doctor } from "./doctor.js";

const program = new Command();

program
  .name("fpt")
  .description("Firestore Power Tools (local-first)")
  .version("0.1.0");

program
  .command("setup")
  .description("Interactive setup wizard (ADC auth, project id, defaults)")
  .action(async () => {
    await setupWizard();
  });

program
  .command("doctor")
  .description("Sanity-check your environment (gcloud, ADC, Firestore access)")
  .option("--project <projectId>", "GCP project id")
  .option("--port <port>", "local API port")
  .option("--ui <uiUrl>", "UI dev server URL", "http://127.0.0.1:5173")
  .action(async (opts) => {
    const port = opts.port ? Number(opts.port) : undefined;
    await doctor({ projectId: opts.project, port, uiUrl: opts.ui });
  });

program
  .command("serve")
  .alias("up")
  .alias("start")
  .description("Start local API server")
  .option("--project <projectId>", "GCP project id")
  .option("--port <port>", "port")
  .action(async (opts) => {
    const cfg = await loadConfig();
    const projectId = opts.project ?? cfg.projectId;
    const port = Number(opts.port ?? cfg.port ?? 4011);
    if (!projectId) {
      throw new Error("Missing project id. Run `fpt setup` or pass --project <id>.");
    }
    await serve({ projectId, port, writeEnabled: cfg.writeEnabled, writeToken: cfg.writeToken });
  });

program
  .command("run")
  .alias("dev")
  .description("Start the local API server and print UI instructions")
  .option("--project <projectId>", "GCP project id")
  .option("--port <port>", "local API port")
  .option("--ui <uiUrl>", "UI dev server URL", "http://127.0.0.1:5173")
  .option("--no-open", "do not open the UI automatically")
  .action(async (opts) => {
    const cfg = await loadConfig();
    const projectId = opts.project ?? cfg.projectId;
    const port = Number(opts.port ?? cfg.port ?? 4011);

    if (!projectId) {
      throw new Error("Missing project id. Run `fpt setup` or pass --project <id>.");
    }

    const apiUrl = `http://127.0.0.1:${port}`;
    const uiUrl = String(opts.ui);

    // Start server (non-blocking)
    await serve({ projectId, port, writeEnabled: cfg.writeEnabled, writeToken: cfg.writeToken });

    // Friendly instructions
    process.stdout.write(
      [
        "\nFirestore Power Tools is running:",
        `  API: ${apiUrl}`,
        `  UI:  ${uiUrl}`,
        "\nIf the UI isn't running yet, start it in another terminal:",
        "  pnpm --filter @fpt/ui dev",
      ].join("\n") + "\n"
    );

    if (opts.open) {
      // Best-effort (no hard dependency)
      const { spawn } = await import("node:child_process");
      const cmd =
        process.platform === "darwin"
          ? "open"
          : process.platform === "win32"
            ? "start"
            : "xdg-open";
      try {
        // On Windows, `start` is a shell builtin.
        spawn(cmd, [uiUrl], { stdio: "ignore", shell: process.platform === "win32" });
      } catch {
        // ignore
      }
    }
  });

// Shorthands for common actions
program
  .command("infer")
  .description("Infer observed schema (shorthand for: schema infer)")
  .option("--project <projectId>", "GCP project id")
  .requiredOption("--collection <collection>", "collection name")
  .option("--limit <n>", "sample size", "200")
  .action(async (opts) => {
    const cfg = await loadConfig();
    const projectId = opts.project ?? cfg.projectId;
    if (!projectId) {
      throw new Error("Missing project id. Run `fpt setup` or pass --project <id>.");
    }

    const out = await inferSchema({
      projectId,
      collection: opts.collection,
      limit: Number(opts.limit),
    });
    process.stdout.write(JSON.stringify(out, null, 2) + "\n");
  });

const schemaCmd = program.command("schema").description("Schema tools");

schemaCmd
  .command("infer")
  .description("Infer observed schema from sampled documents")
  .option("--project <projectId>", "GCP project id")
  .requiredOption("--collection <collection>", "collection name")
  .option("--limit <n>", "sample size", "200")
  .action(async (opts) => {
    const cfg = await loadConfig();
    const projectId = opts.project ?? cfg.projectId;
    if (!projectId) {
      throw new Error("Missing project id. Run `fpt setup` or pass --project <id>.");
    }

    const out = await inferSchema({
      projectId,
      collection: opts.collection,
      limit: Number(opts.limit),
    });
    process.stdout.write(JSON.stringify(out, null, 2) + "\n");
  });

await program.parseAsync(process.argv);
