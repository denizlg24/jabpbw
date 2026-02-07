# Goal

This project is a tool that helps me write blog posts for my portfolio denizlg24.com - **JABPBW : Just A Boring Portfolio Blog Writer**

## Design

This project will be a TUI, completely autonomous, except the first user input and last user confirmation. It will interact with denizlg24.com api endpoints using an api key that can be setup by the user.

### How it works

**Case 1 (User Inputs topic)**

1. The app first asks for a user input of the topic they want to write about.
2. The app makes a request to an llm like claude opus 4.5 or sonnet 4.5 to write a blog post about it.
3. The app makes a request to an llm acting like a corrector that finds things to correct on the blog post to remove usual AI patterns, redundancies, fact check etc...
4. The app makes a request to an llm to write the corrected version, and output it in the json format that is needed for the api post request.
5. The app shows the user the final blog post and asks if it is approved. If approved it gets uploaded via API.

**Case 2 (User leaves input empty)**

1. The app fetches previous blog post's summaries.
2. The app thinks of alternatives of relevant and recent tech/sport/life-style related topics to write about and sends it to the llm in step 2.
3. The app makes a request to an llm like claude opus 4.5 or sonnet 4.5 to choose a topic from that list and write a blog post about it.
4. The app makes a request to an llm acting like a corrector that finds things to correct on the blog post to remove usual AI patterns, redundancies, fact check etc...
5. The app makes a request to an llm to write the corrected version, and output it in the json format that is needed for the api post request.
6. The app shows the user the final blog post and asks if it is approved. If approved it gets uploaded via API.

#### Tech Stack

- For the TUI interface https://opentui.com/docs
- https://denizlg24.com for the API.
- Typescript

#### Constraint (IMPORTANT!)

- Reduce token usages as much as possible so be smart with what contexts to keep to avoid resending the whole blog post multiple times etc..
- Avoid using quick hacks and fixes and focus on production grade code, solid and secure. Reuse components whenever possible.
- Avoid unnecessary comments unless they explain complex code.
- Use the msmps/opentui-skill skill.
- Use bun for node commands.
- Never run bun dev as the dev version will always be running.

#### denizlg24.com API Docs

**Authentication**
Include in all the request headers:

authorization: Bearer dlg24\_****\*\*\*\*****

The relevant API routes for blog related activities are:

**Get all blog posts**
GET:
/api/admin/blogs
Responses:
200 (OK) {blogs:IBlog[]}
500 (Server Error)
403 (Forbidden)

**Create a post**
POST:
/api/admin/blogs
Request Body:

```js
{
    title: string, // The title displayed in the blogs page
    excerpt: string, // Couple of sentences representing the summary of the blog post
    media: string[] // Used if there are images in the middle of the blog post, for now default to an empty array,
    content: string // Markdown content of the blog post (Full Post)
    tags: string[] // Array of strings corresponding to tags related to the post, usually single word, keyword
    isActive: boolean // True if it should be displayed in the website, default to true
}
```

Responses:
200 (OK) {blog:IBlog}
500 (Server Error)
403 (Forbidden)

**Blog Type**

```js
interface IBlog extends Document {
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    timeToRead: number;
    media?: string[];
    tags?: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
```

## Implementation Progress (Context for new sessions)

This section documents what has been built so far so any new Claude instance can continue without re-exploring the codebase.
This section should **ALWAYS** be updated before compacting context and after **EVERY** successful run!

### Project Structure

```
src/
  index.tsx          # App entry point, renderer setup, page routing
  lib/
    config.ts        # API key + model persistence (~/.portfolio-blog-writer/config.json)
    api.ts           # denizlg24.com API client (fetch blogs, create blog)
    llm.ts           # Claude API blog generation pipeline (brainstorm + 3-step) with web search tool
    models.ts        # Model definitions (IDs, names, pricing per MTok)
  pages/
    setup.tsx        # First-run setup: portfolio key → Anthropic key → model selection
    home.tsx         # Main page with topic textarea input
    writing.tsx      # Progress page showing 3-step LLM pipeline + live token usage
    preview.tsx      # Blog post preview with approve/discard + total cost display
    api-test.tsx     # Temporary debug page to verify API connectivity
```

### Routing

`index.tsx` manages a `page` state (`"setup" | "home" | "writing" | "preview" | "api-test"`) and flow state (`topic: string`, `pipelineResult: PipelineResult | null`). On startup it checks `hasAllKeys()` — if any key/model is missing it shows `SetupPage`, otherwise `HomePage`. Flow: home → writing → preview → home.

### Config (`src/lib/config.ts`)

Stores/reads a JSON config at `~/.portfolio-blog-writer/config.json` with `{ apiKey, anthropicApiKey, modelId }`. Uses `updateConfig(partial)` to merge fields without overwriting others. Exports:
- `getApiKey()`, `saveApiKey(key)`, `hasApiKey()` — portfolio API key
- `getAnthropicApiKey()`, `saveAnthropicApiKey(key)`, `hasAnthropicApiKey()` — Anthropic API key
- `getModelId()`, `saveModelId(id)`, `hasModelId()` — selected Claude model
- `hasAllKeys()` — checks all three are present

### Models (`src/lib/models.ts`)

Defines available Claude models with pricing:
- **Sonnet 4.5** (`claude-sonnet-4-5-20250929`): $3/$15 per MTok (default)
- **Opus 4.6** (`claude-opus-4-6`): $5/$25 per MTok
- **Haiku 4.5** (`claude-haiku-4-5-20251001`): $1/$5 per MTok

Exports `MODELS`, `DEFAULT_MODEL`, `getModelDef(id)`, `calculateCost(modelId, inputTokens, outputTokens)`.

### API Client (`src/lib/api.ts`)

- `fetchBlogs()` — GET `/api/admin/blogs`, returns full `IBlog[]`.
- `fetchBlogSummaries()` — Same endpoint but strips to `{ title, excerpt, tags }[]` to minimize token usage when sending context to the LLM.
- `createBlog(payload)` — POST `/api/admin/blogs` with `CreateBlogPayload`.
- All requests use `getApiKey()` for the `Authorization: Bearer` header.

### LLM Pipeline (`src/lib/llm.ts`)

Uses `@anthropic-ai/sdk` with the user-selected model (`maxRetries: 3`). Pipeline exposed via `generateBlog(topic, onProgress)`:
- When `topic` is empty (Case 2): adds a **brainstormTopic** step first — fetches blog summaries via `fetchBlogSummaries()`, sends them to the LLM with web search (`tool_choice: "any"`) to pick a fresh topic (max 256 output tokens). The chosen topic is then fed into the normal pipeline.
- **writeBlogPost** (max 4096 tokens) — Sends topic, gets markdown blog post (800-1500 words). Includes Anthropic's `web_search_20250305` server tool (max 3 uses, `tool_choice: "any"`) so Claude can search the web when the topic references URLs, specific projects, or recent events. System prompt instructs when to use search vs. relying on existing knowledge.
- **reviewBlogPost** (max 1024 tokens) — Sends draft, gets compact numbered correction list. Returns "NO CORRECTIONS NEEDED" if post is clean.
- **formatBlogPost** (max 5120 tokens) — Sends draft + corrections, gets final `CreateBlogPayload` JSON. Needs higher limit because it re-outputs the full corrected blog content inside JSON.

**Response extraction**: `extractText(response)` joins all `text` blocks from the response (which may contain interleaved `server_tool_use` and `web_search_tool_result` blocks). When no text is found, `TextExtractionError` is thrown with a specific message based on the `stop_reason`:
- `max_tokens` → "Response truncated: output token limit reached"
- `tool_use` → lists which tools the model invoked
- `end_turn` → "Model returned empty response"
- `stop_sequence` → stopped without text

**Error handling**: `generateBlog` wraps the pipeline in try/catch. SDK errors (`APIError`, `APIConnectionError`) are mapped to user-friendly messages via `formatApiError()`:
- `AuthenticationError` (401) → check API key
- `RateLimitError` (429) → try again in a minute
- `APIConnectionError` → check internet
- 529 → overloaded, 403 → permission, 413 → request too large
Non-API errors (JSON parse, zod validation) pass through as-is.

`PipelineStep` type: `"brainstorming" | "writing" | "reviewing" | "formatting"`. Each step returns `StepResult<T>` with `{ data, inputTokens, outputTokens }`. The pipeline accumulates token counts and reports `PipelineProgress { step, usage: TokenUsage }` after each step via callback. Returns `PipelineResult { payload, usage }`.

**Token budget rationale** (keep `max_tokens` low — OTPM rate limits are estimated upfront from this value; Tier 1 only has 8000 OTPM):
- Brainstorm: 256 (single sentence + search query overhead)
- Writer: 4096 (1500-word post ≈ 2200 tokens + web search tool call overhead)
- Reviewer: 1024 (short correction list)
- Formatter: 5120 (full blog JSON — the content field alone can be ~2200 tokens)

Web search is billed separately by Anthropic at $10/1000 searches. The Anthropic client is created once per pipeline run.

### Pages

- **SetupPage** — Three-step flow: (1) portfolio API key (`dlg24_` prefix), (2) Anthropic API key (`sk-ant-` prefix), (3) model selection via `<select>` with `selectedIndex` pre-set to current model. On first run, skips already-configured steps. In reconfigure mode (Ctrl+S from home): shows "Settings" header, displays current masked key values and current model name, Tab/Shift+Tab to navigate between steps without changing anything, Enter to save a new value or skip if empty, Backspace on empty input to go back. Accepts optional `onBack` prop — when provided, enables reconfigure mode.
- **HomePage** — ASCII "Welcome" header, `<textarea>` for topic input (Enter to submit, empty submit triggers auto-topic). Uses a ref to read `plainText` from the textarea on submit. Ctrl+S opens settings, Ctrl+T navigates to API test page.
- **WritingPage** — ASCII "Writing" header, shows progress steps with spinner animation (80ms interval). When topic is empty, shows 4 steps (brainstorming + writing + reviewing + formatting); otherwise 3 steps (writing + reviewing + formatting). Steps show ✓ when done, spinner when active, ○ when pending. Displays live token usage line: model name, input/output tokens, running cost. Calls `generateBlog()` on mount, transitions to preview on success. Shows errors inline with Enter to go back.
- **PreviewPage** — ASCII "Preview" header, shows blog title/excerpt/tags in a bordered box, and full markdown content in a scrollbox. Displays total token usage and cost. Enter to approve & upload, Backspace to discard. Success/error status shown as single-line text to avoid overlap.
- **ApiTestPage** — Temporary page. Fetches blog summaries on mount, shows count + scrollable list of titles/excerpts/tags. Backspace to return home. Can be removed once the main flow is complete.

### What's Left to Build

1. Remove `api-test.tsx` and the Ctrl+T shortcut once the real flow is complete.

### OpenTUI Patterns Used

- React reconciler (`@opentui/react`) with JSX.
- `useKeyboard()` for global key handling (ESC to exit, Ctrl+T for test, Backspace for back).
- `useRef()` with `TextareaRenderable` to read `plainText` from textarea on submit.
- Components: `<ascii-font>`, `<text>`, `<box>`, `<input>`, `<textarea>`, `<scrollbox>`, `<select>`.
- Spinner animation via `setInterval` cycling through braille frames.
- Focus is managed via the `focused` prop on input components.
- `tsconfig.json` uses `"jsxImportSource": "@opentui/react"` and `"jsx": "react-jsx"`.
