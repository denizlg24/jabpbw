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
    config.ts        # API key persistence (~/.portfolio-blog-writer/config.json)
    api.ts           # denizlg24.com API client (fetch blogs, create blog)
  pages/
    setup.tsx        # First-run API key input page
    home.tsx         # Main page with topic textarea input
    api-test.tsx     # Temporary debug page to verify API connectivity
```

### Routing

`index.tsx` manages a simple `page` state (`"setup" | "home" | "api-test"`). On startup it checks `hasApiKey()` — if no key is stored it shows `SetupPage`, otherwise `HomePage`. The `api-test` page is a temporary prototype reachable via Ctrl+T from home.

### Config (`src/lib/config.ts`)

Stores/reads a JSON config at `~/.portfolio-blog-writer/config.json`. Exports `getApiKey()`, `saveApiKey(key)`, `hasApiKey()`. Uses synchronous Node fs calls.

### API Client (`src/lib/api.ts`)

- `fetchBlogs()` — GET `/api/admin/blogs`, returns full `IBlog[]`.
- `fetchBlogSummaries()` — Same endpoint but strips to `{ title, excerpt, tags }[]` to minimize token usage when sending context to the LLM.
- `createBlog(payload)` — POST `/api/admin/blogs` with `CreateBlogPayload`.
- All requests use `getApiKey()` for the `Authorization: Bearer` header.

### Pages

- **SetupPage** — ASCII "Setup" header, single `<input>` for API key, validates `dlg24_` prefix and minimum length, saves via `saveApiKey()`, calls `onComplete` to transition to home.
- **HomePage** — ASCII "Welcome" header, `<textarea>` for topic input (Ctrl+Enter to submit). The submit handler is currently a placeholder `console.log`. Ctrl+T navigates to API test page.
- **ApiTestPage** — Temporary page. Fetches blog summaries on mount, shows count + scrollable list of titles/excerpts/tags. Backspace to return home. Can be removed once the main flow is built.

### What's Left to Build

1. LLM integration (Claude API calls for writing, correcting, formatting the blog post).
2. Case 1 flow: topic submitted from home textarea -> LLM write -> LLM correct -> LLM format to JSON -> preview -> upload.
3. Case 2 flow: empty submit -> fetch summaries -> LLM generates topic ideas -> same pipeline as Case 1.
4. Preview/approval page showing the final blog post before upload.
5. Remove `api-test.tsx` and the Ctrl+T shortcut once the real flow is complete.

### OpenTUI Patterns Used

- React reconciler (`@opentui/react`) with JSX.
- `useKeyboard()` for global key handling (ESC to exit, Ctrl+T for test, Backspace for back).
- Components: `<ascii-font>`, `<text>`, `<box>`, `<input>`, `<textarea>`, `<scrollbox>`, `<select>`.
- Focus is managed via the `focused` prop on input components.
- `tsconfig.json` uses `"jsxImportSource": "@opentui/react"` and `"jsx": "react-jsx"`.
