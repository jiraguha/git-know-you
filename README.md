# dev-profile

A CLI tool that builds developer profiles focused on open source contributions by analyzing GitHub activity.

Answer the question: **"Do you contribute to open source? If so, tell us more about it."**

## Features

- Fetches and analyzes public GitHub data
- Discovers all projects you've contributed to (owned, forked, external)
- Computes per-project metrics: commits, PRs, issues, reviews, docs, discussions
- Generates human-readable summaries of your OSS involvement
- Displays beautiful terminal tables with contribution breakdowns
- Persists profiles locally for quick access

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/dev-profile.git
cd dev-profile

# Install dependencies
bun install

# Link globally (optional)
bun link
```

## Usage

### Build a Profile

```bash
bun run src/index.ts build <username>
# or if linked:
dev-profile build <username>
```

**Example output:**

```
🔍 Fetching GitHub data for jpmusic2...
   Fetching repos...        ✅ 42 repos
   Fetching events...       ✅ 387 events
   Fetching contributions... ✅ 8 projects analyzed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Open Source Contribution Profile: jpmusic2

  Do you contribute to open source?  YES — Active contributor

  Summary:
  jpmusic2 is an active open source contributor with 42 public repositories.
  They primarily work in TypeScript and Python. They have contributed to 5
  external projects including notable-project and another-one.

  Primary Languages:          TypeScript (45%), Python (30%), Go (15%)
  Activity Level:             387 contributions in the last year

  📊 Per-Project Breakdown:

  Owned Projects
  ┌──────────────────────┬───────┬─────────┬───────┬────────┬─────────┬──────┐
  │ Project              │ ⭐    │ Commits │ PRs   │ Issues │ Reviews │ Docs │
  ├──────────────────────┼───────┼─────────┼───────┼────────┼─────────┼──────┤
  │ top-repo             │ 85    │ 312     │ 24    │ 18     │ 47      │ 5    │
  │ another-repo         │ 35    │ 156     │ 12    │ 8      │ 15      │ 3    │
  └──────────────────────┴───────┴─────────┴───────┴────────┴─────────┴──────┘

💾 Profile saved to ./profiles/jpmusic2.json
```

### Other Commands

```bash
# Display a saved profile
dev-profile show <username>

# List all saved profiles
dev-profile list

# Export to JSON or Markdown
dev-profile export <username> --format=json
dev-profile export <username> --format=md

# Re-fetch and update an existing profile
dev-profile refresh <username>
```

## Metrics Tracked

| Metric | Description |
|--------|-------------|
| **Commits** | Total commits authored by the user |
| **Pull Requests** | PRs opened by the user |
| **Issues** | Issues created by the user |
| **Reviews** | PRs where the user provided a review |
| **Docs** | Commits touching docs/, *.md, *.rst, README, CHANGELOG |
| **Discussions** | Issue threads where the user commented |

## Activity Levels

Based on total contributions, profiles are classified as:

| Level | Criteria |
|-------|----------|
| **Inactive** | 0 total contributions |
| **Occasional** | < 50 total contributions |
| **Active** | 50 - 500 contributions |
| **Prolific** | > 500 contributions |

## GitHub Authentication

The tool works without authentication (60 requests/hour), but for better results:

```bash
export GITHUB_TOKEN=your_token_here
dev-profile build <username>
```

With a token, you get 5,000 requests/hour and can analyze larger profiles.

## Project Structure

```
src/
├── index.ts              # CLI entry point
├── commands/
│   ├── build.ts          # Fetch + analyze + save
│   ├── show.ts           # Display saved profile
│   ├── list.ts           # List all profiles
│   ├── export.ts         # Export to JSON/Markdown
│   └── refresh.ts        # Re-fetch and update
├── github/
│   ├── client.ts         # GitHub API client
│   ├── fetcher.ts        # Data fetching with pagination
│   └── types.ts          # API response types
├── analyzer/
│   ├── project-counts.ts # Per-project counting
│   ├── project-discovery.ts
│   ├── languages.ts      # Language aggregation
│   ├── activity.ts       # Activity level computation
│   └── narrative.ts      # Summary text generation
├── schema/
│   └── profile.ts        # Zod schemas
├── storage/
│   └── json-store.ts     # Profile persistence
└── utils/
    └── display.ts        # Table rendering
```

## Tech Stack

- **Runtime:** [Bun](https://bun.sh) - Fast JavaScript runtime
- **CLI Framework:** [Cliffy](https://cliffy.io) - Command routing and table rendering
- **Validation:** [Zod](https://zod.dev) - Schema validation
- **Styling:** [Chalk](https://github.com/chalk/chalk) - Terminal colors

## Development

```bash
# Run the project
bun run src/index.ts

# Run tests
bun test

# Type check
bun run tsc --noEmit
```

## License

MIT
