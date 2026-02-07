# JABPBW

> **Just A Boring Portfolio Blog Writer**

JABPBW is an automated blog-writing tool used to generate and refine posts for my personal portfolio.

It analyzes existing posts, proposes new topics, writes a draft, critiques it, and outputs a final, publish-ready article.

There's nothing fancy here — the interesting part is how it's built, not what it claims to be.

## Install

### Linux / macOS

```bash
curl -fsSL https://raw.githubusercontent.com/denizlg24/jabpbw/master/install.sh | sh
```

### Windows (PowerShell)

```powershell
irm https://raw.githubusercontent.com/denizlg24/jabpbw/master/install.ps1 | iex
```

Then open a new terminal and run:

```
jabpbw
```

Binaries are also available directly from the [Releases](https://github.com/denizlg24/jabpbw/releases/latest) page.

## Development

```bash
bun install
bun dev
```

## Build from source

```bash
bun run build
```
