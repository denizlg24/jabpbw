import { homedir } from "os";
import { join } from "path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";

interface Config {
  apiKey: string;
  anthropicApiKey?: string;
  modelId?: string;
}

const CONFIG_DIR = join(homedir(), ".portfolio-blog-writer");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function readConfig(): Config | null {
  if (!existsSync(CONFIG_FILE)) return null;
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, "utf-8")) as Config;
  } catch {
    return null;
  }
}

function writeConfig(config: Config): void {
  ensureConfigDir();
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
}

function updateConfig(partial: Partial<Config>): void {
  const existing = readConfig();
  writeConfig({ apiKey: "", ...existing, ...partial });
}

export function getApiKey(): string | null {
  return readConfig()?.apiKey ?? null;
}

export function saveApiKey(apiKey: string): void {
  updateConfig({ apiKey });
}

export function hasApiKey(): boolean {
  const key = getApiKey();
  return key !== null && key.length > 0;
}

export function getAnthropicApiKey(): string | null {
  return readConfig()?.anthropicApiKey ?? null;
}

export function saveAnthropicApiKey(apiKey: string): void {
  updateConfig({ anthropicApiKey: apiKey });
}

export function hasAnthropicApiKey(): boolean {
  const key = getAnthropicApiKey();
  return key !== null && key.length > 0;
}

export function getModelId(): string | null {
  return readConfig()?.modelId ?? null;
}

export function saveModelId(modelId: string): void {
  updateConfig({ modelId });
}

export function hasModelId(): boolean {
  const id = getModelId();
  return id !== null && id.length > 0;
}

export function hasAllKeys(): boolean {
  return hasApiKey() && hasAnthropicApiKey() && hasModelId();
}
