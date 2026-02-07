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

const AUTHOR_FILE = join(CONFIG_DIR, "author.md");

export function getAuthorProfile(): string | null {
  if (!existsSync(AUTHOR_FILE)) return null;
  try {
    const content = readFileSync(AUTHOR_FILE, "utf-8").trim();
    if (!content || content === AUTHOR_TEMPLATE.trim()) return null;
    return content;
  } catch {
    return null;
  }
}

export function ensureAuthorFile(): void {
  ensureConfigDir();
  if (!existsSync(AUTHOR_FILE)) {
    writeFileSync(AUTHOR_FILE, AUTHOR_TEMPLATE, "utf-8");
  }
}

export function getAuthorFilePath(): string {
  return AUTHOR_FILE;
}

const AUTHOR_TEMPLATE = `# Author Profile
# Fill in as much or as little as you want. The blog writer uses this to match your voice.
# Lines starting with # are ignored.

## Identity
Name:
Age:
Location:
Occupation / Role:
Education background:

## Personality & Voice
How would friends describe you?:
Your sense of humor (dry, sarcastic, wholesome, etc.):
Do you swear / use slang in writing?:
Are you more formal or casual?:
Do you tend to be opinionated or balanced?:

## Interests & Expertise
Primary tech stack / languages:
Favorite tools or frameworks:
Side projects you're proud of:
Non-tech hobbies (sports, music, gaming, etc.):
Sports you follow / teams you support:
Lifestyle topics you care about (fitness, productivity, travel, etc.):

## Writing Style
Blog posts you've written that you liked (and why):
Writers or bloggers you admire:
Topics you never want to write about:
Pet peeves in tech writing:
Preferred post length (short & punchy vs. deep dives):

## Current Life Context
What are you working on right now?:
What are you learning?:
Any recent experiences worth writing about?:
What's been on your mind lately?:

## Opinions & Takes
A tech hill you'd die on:
An unpopular opinion you hold:
Something overhyped in tech right now:
Something underrated in tech right now:
`;
