import Anthropic, {
  APIError,
  APIConnectionError,
  AuthenticationError,
  RateLimitError,
} from "@anthropic-ai/sdk";
import { getAnthropicApiKey, getModelId } from "./config";
import {
  CreateBlogPayloadSchema,
  type CreateBlogPayload,
  fetchBlogSummaries,
} from "./api";
import { DEFAULT_MODEL, calculateCost } from "./models";

function getClient(): Anthropic {
  const apiKey = getAnthropicApiKey();
  if (!apiKey) throw new Error("Anthropic API key not configured.");
  return new Anthropic({ apiKey, maxRetries: 3 });
}

function getModel(): string {
  return getModelId() ?? DEFAULT_MODEL.id;
}

function formatApiError(error: unknown): string {
  if (error instanceof AuthenticationError) {
    return "Invalid Anthropic API key. Update it in settings (Ctrl+S).";
  }
  if (error instanceof RateLimitError) {
    return "Rate limit exceeded after retries. Try again in a minute.";
  }
  if (error instanceof APIConnectionError) {
    return "Could not connect to Anthropic. Check your internet connection.";
  }
  if (error instanceof APIError) {
    if (error.status === 529)
      return "Anthropic API is overloaded. Try again later.";
    if (error.status === 403)
      return "API key lacks permission for this request.";
    if (error.status === 413) return "Request too large. Try a shorter topic.";
    return `API error (${error.status}): ${error.message}`;
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred.";
}

export type PipelineStep =
  | "brainstorming"
  | "writing"
  | "reviewing"
  | "formatting";

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

const WRITER_SYSTEM = `You are a skilled blog writer for a personal tech/sports/lifestyle portfolio blog. Write engaging, natural blog posts in markdown format. The posts should:
- Sound human and conversational, not robotic or corporate
- Be well-structured with clear headings (## for sections)
- Include a compelling introduction and conclusion
- Be between 800-1500 words
- Avoid clichés, filler phrases, and typical AI patterns like "In today's world", "Let's dive in", "In conclusion", "It's not X, it's Y", etc.
- Use specific examples and concrete details
You have access to a web search tool. Use it when the topic references a URL, a specific project, recent events, or anything you need to fact-check or gather details about. Do NOT search for general knowledge you already know well.
Output ONLY the markdown content of the blog post, nothing else.`;

const REVIEWER_SYSTEM = `You are a sharp editorial reviewer. Given a blog post, output a concise numbered list of corrections. Focus on:
- AI-sounding phrases or patterns to rephrase
- Factual inaccuracies to fix
- Redundant sentences to remove
- Awkward phrasing to improve
- Missing transitions or flow issues
Be brief and specific. Each item should be one line: the problem and the fix.
If the post is good, output "NO CORRECTIONS NEEDED".
Output ONLY the correction list, nothing else.`;

const FORMATTER_SYSTEM = `You are a formatting assistant. Given a blog post and a list of corrections, apply the corrections and output a JSON object matching this exact schema:
{
  "title": "string (catchy blog title)",
  "excerpt": "string (2-3 sentence summary)",
  "content": "string (full corrected markdown content)",
  "tags": ["string (single-word relevant, capitalized, keywords, 1-4 tags)"],
  "media": [],
  "isActive": true
}
Output ONLY valid JSON, no markdown fences, no explanation.`;

const BRAINSTORM_SYSTEM = `You suggest blog post topics for a personal tech/sports/lifestyle portfolio blog. Given a list of existing blog post summaries, suggest a single fresh topic that:
- Does NOT overlap with existing posts
- Is relevant and timely in tech, sports, or lifestyle
- Would be interesting to a developer/tech enthusiast audience
- Is specific enough to write a focused post about
- Don't ever imagine tools that I haven't built yet.
- You have web search capabilities, so you can suggest topics about recent events, new projects, or specific technologies.
- You can access https://github.com/denizlg24?tab=repositories to check for new repositories or projects to write about.
Output ONLY the topic as a single sentence (under 15 words), nothing else.`;

class TextExtractionError extends Error {
  constructor(
    message: string,
    public readonly stopReason: string,
    public readonly response: Anthropic.Messages.Message,
  ) {
    super(message);
    this.name = "TextExtractionError";
  }
}

function extractText(response: Anthropic.Messages.Message): string {
  const textBlocks = response.content.filter(
    (block): block is Anthropic.Messages.TextBlock => block.type === "text",
  );

  if (textBlocks.length > 0) {
    return textBlocks
      .map((block) => block.text)
      .join(" ")
      .trim();
  }

  const { stop_reason, content } = response;

  if (stop_reason === "max_tokens") {
    throw new TextExtractionError(
      "Response truncated: output token limit reached",
      stop_reason,
      response,
    );
  }

  if (stop_reason === "tool_use") {
    const toolNames = content
      .filter(
        (block): block is Anthropic.Messages.ToolUseBlock =>
          block.type === "tool_use",
      )
      .map((block) => block.name);

    throw new TextExtractionError(
      `No text content. Model invoked tools: ${toolNames.join(", ")}`,
      stop_reason,
      response,
    );
  }

  if (stop_reason === "end_turn") {
    throw new TextExtractionError(
      "Model returned empty response",
      stop_reason,
      response,
    );
  }

  if (stop_reason === "stop_sequence") {
    throw new TextExtractionError(
      "Response stopped at configured stop sequence without text",
      stop_reason,
      response,
    );
  }

  throw new TextExtractionError(
    `No text content (stop_reason: unknown)`,
    "unknown",
    response,
  );
}

interface StepResult<T> {
  data: T;
  inputTokens: number;
  outputTokens: number;
}

async function brainstormTopic(
  client: Anthropic,
  model: string,
  summaries: { title: string; excerpt: string; tags?: string[] }[],
): Promise<StepResult<string>> {
  const summaryText =
    summaries.length > 0
      ? summaries.map((s) => `- "${s.title}": ${s.excerpt}`).join("\n")
      : "No existing posts yet.";

  const response = await client.messages.create({
    model,
    max_tokens: 256,
    system: BRAINSTORM_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Existing blog posts:\n${summaryText}\n\nSuggest one new topic.`,
      },
    ],
    tool_choice: {
      type: "any",
    },
    tools: [WEB_SEARCH_TOOL],
  });
  return {
    data: extractText(response).trim(),
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

const WEB_SEARCH_TOOL = {
  type: "web_search_20250305" as const,
  name: "web_search" as const,
  max_uses: 3,
};

async function writeBlogPost(
  client: Anthropic,
  model: string,
  topic: string,
): Promise<StepResult<string>> {
  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    system: WRITER_SYSTEM,
    tools: [WEB_SEARCH_TOOL],
    tool_choice: {
      type: "any",
    },
    messages: [{ role: "user", content: `Write a blog post about: ${topic}` }],
  });
  return {
    data: extractText(response),
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

async function reviewBlogPost(
  client: Anthropic,
  model: string,
  content: string,
): Promise<StepResult<string>> {
  const response = await client.messages.create({
    model,
    max_tokens: 1024,
    system: REVIEWER_SYSTEM,
    messages: [{ role: "user", content }],
  });
  return {
    data: extractText(response),
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

async function formatBlogPost(
  client: Anthropic,
  model: string,
  content: string,
  corrections: string,
): Promise<StepResult<CreateBlogPayload>> {
  const userMessage =
    corrections.trim() === "NO CORRECTIONS NEEDED"
      ? `Blog post:\n${content}\n\nNo corrections needed. Format this post as JSON.`
      : `Blog post:\n${content}\n\nCorrections to apply:\n${corrections}`;

  const response = await client.messages.create({
    model,
    max_tokens: 5120,
    system: FORMATTER_SYSTEM,
    messages: [{ role: "user", content: userMessage }],
  });

  let raw = extractText(response).trim();
  const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    raw = fenceMatch[1]!.trim();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("LLM returned invalid JSON. Please try again.");
  }

  const result = CreateBlogPayloadSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues.map((i) => i.message).join(", ");
    throw new Error(`Invalid blog payload: ${issues}`);
  }

  return {
    data: result.data,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

export interface PipelineProgress {
  step: PipelineStep;
  usage: TokenUsage;
}

export interface PipelineResult {
  payload: CreateBlogPayload;
  usage: TokenUsage;
}

export async function generateBlog(
  topic: string,
  onProgress: (progress: PipelineProgress) => void,
): Promise<PipelineResult> {
  const client = getClient();
  const model = getModel();
  let totalInput = 0;
  let totalOutput = 0;
  let resolvedTopic = topic;

  const reportProgress = (step: PipelineStep) => {
    onProgress({
      step,
      usage: {
        inputTokens: totalInput,
        outputTokens: totalOutput,
        cost: calculateCost(model, totalInput, totalOutput),
      },
    });
  };

  try {
    if (!resolvedTopic) {
      reportProgress("brainstorming");
      const summaries = await fetchBlogSummaries();
      const brainstorm = await brainstormTopic(client, model, summaries);
      totalInput += brainstorm.inputTokens;
      totalOutput += brainstorm.outputTokens;
      resolvedTopic = brainstorm.data;
    }

    reportProgress("writing");
    const draft = await writeBlogPost(client, model, resolvedTopic);
    totalInput += draft.inputTokens;
    totalOutput += draft.outputTokens;

    reportProgress("reviewing");
    const review = await reviewBlogPost(client, model, draft.data);
    totalInput += review.inputTokens;
    totalOutput += review.outputTokens;

    reportProgress("formatting");
    const formatted = await formatBlogPost(
      client,
      model,
      draft.data,
      review.data,
    );
    totalInput += formatted.inputTokens;
    totalOutput += formatted.outputTokens;

    const finalUsage: TokenUsage = {
      inputTokens: totalInput,
      outputTokens: totalOutput,
      cost: calculateCost(model, totalInput, totalOutput),
    };

    return { payload: formatted.data, usage: finalUsage };
  } catch (error) {
    if (error instanceof APIError || error instanceof APIConnectionError) {
      throw new Error(formatApiError(error));
    }
    throw error;
  }
}
