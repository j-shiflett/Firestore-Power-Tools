import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
function configDir() {
    return path.join(os.homedir(), ".fpt");
}
function configPath() {
    return path.join(configDir(), "config.json");
}
export async function loadConfig() {
    try {
        const raw = await fs.readFile(configPath(), "utf8");
        return JSON.parse(raw);
    }
    catch {
        return {};
    }
}
export async function saveConfig(cfg) {
    await fs.mkdir(configDir(), { recursive: true });
    await fs.writeFile(configPath(), JSON.stringify(cfg, null, 2) + "\n", "utf8");
}
export function getConfigPath() {
    return configPath();
}
