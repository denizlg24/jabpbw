# JABPBW

> **Just A Boring Portfolio Blog Writer**

JABPBW is an automated blog-writing tool used to generate and refine posts for my personal portfolio.

It analyzes existing posts, proposes new topics, writes a draft, critiques it, and outputs a final, publish-ready article.

There's nothing fancy here — the interesting part is how it's built, not what it claims to be.

## Install

Download the latest binary for your platform from [Releases](https://github.com/denizlg24/jabpbw/releases/latest).

### Linux (x64)

```bash
curl -Lo jabpbw https://github.com/denizlg24/jabpbw/releases/latest/download/jabpbw-linux-x64
chmod +x jabpbw
sudo mv jabpbw /usr/local/bin/
```

### Linux (ARM64)

```bash
curl -Lo jabpbw https://github.com/denizlg24/jabpbw/releases/latest/download/jabpbw-linux-arm64
chmod +x jabpbw
sudo mv jabpbw /usr/local/bin/
```

### macOS (Apple Silicon)

```bash
curl -Lo jabpbw https://github.com/denizlg24/jabpbw/releases/latest/download/jabpbw-darwin-arm64
chmod +x jabpbw
sudo mv jabpbw /usr/local/bin/
```

### macOS (Intel)

```bash
curl -Lo jabpbw https://github.com/denizlg24/jabpbw/releases/latest/download/jabpbw-darwin-x64
chmod +x jabpbw
sudo mv jabpbw /usr/local/bin/
```

### Windows (x64)

```powershell
Invoke-WebRequest -Uri "https://github.com/denizlg24/jabpbw/releases/latest/download/jabpbw-windows-x64.exe" -OutFile "$env:LOCALAPPDATA\jabpbw.exe"
# Add to PATH (run once)
$path = [Environment]::GetEnvironmentVariable("Path", "User")
if ($path -notlike "*$env:LOCALAPPDATA*") {
    [Environment]::SetEnvironmentVariable("Path", "$path;$env:LOCALAPPDATA", "User")
}
```

Then open a new terminal and run:

```
jabpbw
```

## Development

```bash
bun install
bun dev
```

## Build from source

```bash
bun run build
```
