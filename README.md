# git-know-you

**Showcase your open source journey in seconds.**

Turn any GitHub username into a beautiful contribution profile. See the full picture: repositories owned, external projects contributed to, languages mastered, and impact made across the open source ecosystem.

## Features

- **Complete Discovery** — Finds every project you've touched: owned repos, forks with commits, and external contributions
- **Rich Metrics** — Tracks commits, PRs, issues, reviews, and discussions per project
- **Smart Summaries** — Auto-generates narrative descriptions of your OSS involvement
- **Beautiful Output** — Terminal tables with unicode borders and color-coded stats
- **Export Ready** — Save as JSON or Markdown for portfolios and resumes
- **Lightning Fast** — Built on Bun for instant startup and rapid analysis

## Installation

```bash
git clone https://github.com/jiraguha/git-know-you.git
cd git-know-you
bun install
bun link
```

## Usage

### Build a Profile

```bash
git-know-you build <username>
```

**Example output:**

```
🔍 Fetching GitHub data for jpmusic2...
   Fetching repos...        ✅ 42 repos
   Fetching events...       ✅ 387 events
   Fetching contributions... ✅ 8 projects analyzed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Open Source Contribution Profile: jpmusic2

  Status: Active contributor

  Summary:
  jpmusic2 is an active open source contributor with 42 public repositories.
  They primarily work in TypeScript and Python. They have contributed to 5
  external projects including notable-project and another-one.

  Primary Languages:          TypeScript (45%), Python (30%), Go (15%)
  Activity Level:             387 contributions in the last year

  📊 Per-Project Breakdown:

  Owned Projects
  ┌──────────────────────┬───────┬─────────┬───────┬────────┬─────────┐
  │ Project              │ ⭐    │ Commits │ PRs   │ Issues │ Reviews │
  ├──────────────────────┼───────┼─────────┼───────┼────────┼─────────┤
  │ top-repo             │ 85    │ 312     │ 24    │ 18     │ 47      │
  │ another-repo         │ 35    │ 156     │ 12    │ 8      │ 15      │
  └──────────────────────┴───────┴─────────┴───────┴────────┴─────────┘

💾 Profile saved to ./profiles/jpmusic2.json
```

### Commands

```bash
git-know-you build <username>     # Fetch and analyze GitHub data
git-know-you show <username>      # Display a saved profile
git-know-you list                 # List all saved profiles
git-know-you export <username>    # Export to JSON or Markdown
git-know-you refresh <username>   # Re-fetch and update a profile
```

## Metrics

| Metric | Description |
|--------|-------------|
| **Commits** | Total commits authored |
| **Pull Requests** | PRs opened |
| **Issues** | Issues created |
| **Reviews** | Code reviews given |
| **Discussions** | Issue threads participated in |

## Activity Levels

| Level | Criteria |
|-------|----------|
| **Inactive** | 0 contributions |
| **Occasional** | < 50 contributions |
| **Active** | 50 - 500 contributions |
| **Prolific** | > 500 contributions |

## GitHub Token (Optional)

Works without authentication (60 req/hour). For larger profiles:

```bash
export GITHUB_TOKEN=your_token_here
git-know-you build <username>
```

With a token: 5,000 requests/hour.

## Tech Stack

- **[Bun](https://bun.sh)** — Runtime
- **[Cliffy](https://cliffy.io)** — CLI framework
- **[Zod](https://zod.dev)** — Validation
- **[Chalk](https://github.com/chalk/chalk)** — Colors

## Development

```bash
bun run src/index.ts    # Run
bun test                # Test
bun run tsc --noEmit    # Type check
```

## License

MIT
