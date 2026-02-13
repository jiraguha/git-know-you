# git-know-you — Open Source Contributions CLI

## Overview

A CLI tool that builds developer profiles focused on open source contributions by analyzing GitHub activity. Turn any GitHub username into a comprehensive contribution profile showcasing repositories owned, external projects contributed to, and impact made across the open source ecosystem.

## Goals

- Fetch a developer's public GitHub data and produce a structured open source contribution profile
- Automatically determine whether and how actively someone contributes to OSS
- Generate human-readable narrative summaries of OSS involvement
- Persist profiles as local JSON files for reuse

## How It Works

```
$ git-know-you build jpmusic2


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
  external projects including notable-project and another-one. They maintain
  3 projects with a combined 120+ stars. Their contributions span code,
  documentation, and issue triage.

  Primary Languages:          TypeScript (45%), Python (30%), Go (15%)
  Activity Level:             387 contributions in the last year

  📊 Per-Project Breakdown:

  Owned Projects
  ┌──────────────────────┬───────┬─────────┬───────┬────────┬─────────┬─────────────┐
  │ Project              │ ⭐    │ Commits │ PRs   │ Issues │ Reviews │ Discussions │
  ├──────────────────────┼───────┼─────────┼───────┼────────┼─────────┼─────────────┤
  │ top-repo             │ 85    │ 312     │ 24    │ 18     │ 47      │ 0           │
  │ another-repo         │ 35    │ 156     │ 12    │ 8      │ 15      │ 0           │
  │ small-tool           │ 4     │ 43      │ 3     │ 2      │ 0       │ 0           │
  └──────────────────────┴───────┴─────────┴───────┴────────┴─────────┴─────────────┘

  External Contributions
  ┌──────────────────────┬─────────┬───────┬────────┬─────────┬─────────────┐
  │ Project              │ Commits │ PRs   │ Issues │ Reviews │ Discussions │
  ├──────────────────────┼─────────┼───────┼────────┼─────────┼─────────────┤
  │ org/notable-project  │ 0       │ 8     │ 12     │ 3       │ 5           │
  │ org/another-one      │ 0       │ 3     │ 1      │ 0       │ 0           │
  │ user/some-lib        │ 0       │ 2     │ 4      │ 1       │ 2           │
  └──────────────────────┴─────────┴───────┴────────┴─────────┴─────────────┘

  Totals:  511 commits · 52 PRs · 45 issues · 66 reviews · 7 discussions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💾 Profile saved to ./profiles/jpmusic2.json
```

Tables are rendered using `@cliffy/table` with `.border()` for unicode box-drawing characters.

## GitHub Data Sources

All data comes from the **GitHub REST API v3** (unauthenticated or with optional token for higher rate limits).

### Endpoints Used

| Data Point | Endpoint | Purpose |
|---|---|---|
| User info | `GET /users/{username}` | Name, bio, company, location, public repo count |
| Repos | `GET /users/{username}/repos?type=all&sort=updated&per_page=100` | Owned & forked repos, stars, languages |
| Events | `GET /users/{username}/events/public?per_page=100` | Recent activity: pushes, PRs, issues, reviews |
| Repo languages | `GET /repos/{owner}/{repo}/languages` | Language breakdown per repo |
| Repo commits | `GET /repos/{owner}/{repo}/commits?author={username}&per_page=1` | Commit count per repo (use `Link` header `last` page number for total) |
| Repo PRs (authored) | `GET /search/issues?q=type:pr+author:{username}+repo:{owner}/{repo}` | PR count per repo |
| Repo issues (created) | `GET /search/issues?q=type:issue+author:{username}+repo:{owner}/{repo}` | Issues created per repo |
| Repo reviews | `GET /search/issues?q=type:pr+reviewed-by:{username}+repo:{owner}/{repo}` | Reviews given per repo |
| Repo discussions | `GET /search/issues?q=type:issue+commenter:{username}+repo:{owner}/{repo}+-author:{username}` | Discussion participation (issue comments, not authored) |
| PRs to external repos | Filter events for `PullRequestEvent` where repo owner ≠ username | External contributions |

### Derived Metrics

From the raw API data, compute **per project**:

- **commits**: Total commits authored by the user on that repo
- **pull_requests**: PRs opened by the user on that repo
- **issues_created**: Issues opened by the user on that repo
- **reviews**: PRs where the user provided a review on that repo
- **discussions**: Issue threads where the user commented but did not author the issue

From per-project counts, derive **aggregate metrics**:

- **contributes** (boolean): `true` if any project has ≥1 non-zero count
- **activity_level**: Classify as `inactive` (0 total), `occasional` (<50 total actions), `active` (50-500), `prolific` (>500)
- **maintained_projects**: Owned repos with recent commits + ≥1 star or ≥1 external contributor
- **language_breakdown**: Aggregate language bytes across repos, normalize to percentages
- **totals**: Sum of each count type across all projects

### Project Discovery

The tool should build an **exhaustive list** of all projects the user has interacted with:

1. **Owned repos**: All public repos from `/users/{username}/repos`
2. **Forked repos**: Include forks only if the user has commits on them beyond the fork point
3. **External repos**: Discovered via public events (`PullRequestEvent`, `IssuesEvent`, `IssueCommentEvent`, `PullRequestReviewEvent`) where the repo owner ≠ username
4. **Search fallback**: Use `GET /search/issues?q=author:{username}+type:pr` and `GET /search/issues?q=author:{username}+type:issue` to catch contributions not visible in the (90-day limited) events API

All discovered repos get their per-project counts computed. Projects with all-zero counts are excluded from the final profile.

## Data Model

```json
{
  "username": "string",
  "fetched_at": "ISO8601",
  "github": {
    "name": "string | null",
    "bio": "string | null",
    "company": "string | null",
    "location": "string | null",
    "public_repos": 42,
    "followers": 150,
    "created_at": "ISO8601"
  },
  "open_source": {
    "contributes": true,
    "activity_level": "active",
    "summary": "Auto-generated narrative describing the user's OSS involvement",
    "projects": [
      {
        "repo": "username/repo-name",
        "role": "owner",
        "stars": 85,
        "description": "A tool for ...",
        "language": "TypeScript",
        "counts": {
          "commits": 312,
          "pull_requests": 24,
          "issues_created": 18,
          "reviews": 47,
          "discussions": 0
        }
      },
      {
        "repo": "org/external-project",
        "role": "contributor",
        "stars": 2400,
        "description": "A popular framework",
        "language": "Python",
        "counts": {
          "commits": 0,
          "pull_requests": 8,
          "issues_created": 12,
          "reviews": 3,
          "discussions": 5
        }
      }
    ],
    "totals": {
      "commits": 511,
      "pull_requests": 52,
      "issues_created": 45,
      "reviews": 66,
      "discussions": 7
    },
    "languages": {
      "TypeScript": 45.2,
      "Python": 30.1,
      "Go": 14.8,
      "Other": 9.9
    },
    "maintained_projects": ["repo-1", "repo-2"],
    "stats": {
      "total_stars": 120,
      "total_forks": 34,
      "recent_events_count": 387,
      "account_age_years": 8.5
    }
  }
}
```

## Narrative Generation

The `summary` field is a **locally generated** human-readable paragraph describing the user's open source involvement.

Build the narrative from templates based on the data:

- **No contributions**: _"{username} has a GitHub account but has not yet contributed to public open source projects."_
- **Occasional**: _"{username} has contributed to open source, primarily through {types} on {count} public repositories. Their work focuses on {top_languages}."_
- **Active/Prolific**: _"{username} is an active open source contributor with {repo_count} public repositories and contributions to {external_count} external projects including {notable_projects}. They primarily work in {top_languages} and maintain {maintained_count} projects with a combined {total_stars} stars."_

## Technical Requirements

### Stack
- **Runtime:** Bun (for performance — fast startup, native fetch, fast file I/O)
- **CLI framework:** Cliffy via JSR (`@cliffy/command` for commands, `@cliffy/table` for table rendering, `@cliffy/ansi` for colors/styling)
- **HTTP client:** Native `fetch` (built into Bun)
- **Validation:** Zod for API response and profile schema validation
- **Colors:** `chalk` for inline text coloring (complements Cliffy's table styling)
- **Storage:** Local JSON files in `./profiles/`

### Installing Cliffy with Bun

Cliffy is published on [JSR](https://jsr.io/@cliffy) and works with Bun:

```bash
bunx jsr add @cliffy/command @cliffy/table @cliffy/ansi
bun add zod chalk
```

### Key Cliffy Modules Used

| Module | Import | Purpose |
|---|---|---|
| Command | `@cliffy/command` | Command routing, options, arguments, auto-generated help |
| Table | `@cliffy/table` | Unicode tables with borders, padding, colSpan/rowSpan for contribution breakdown |
| Ansi Colors | `@cliffy/ansi/colors` | Terminal colors and styling for headers, labels, metrics |

### Authentication

- Works **without** a GitHub token (unauthenticated: 60 requests/hour)
- Optionally reads `GITHUB_TOKEN` from environment for higher rate limits (5,000/hour)
- On rate limit hit, display a clear message suggesting token setup

### Commands

Registered as Cliffy subcommands on a root `git-know-you` command:

```
git-know-you build <username>              # Fetch GitHub data & build profile
git-know-you show <username>               # Display a saved profile
git-know-you list                          # List all saved profiles
git-know-you export <username> --format=json|md  # Export profile
git-know-you refresh <username>            # Re-fetch and update an existing profile
```

Optionally add a `bin` entry in `package.json` so it can be run as:

```bash
bun link  # then:
git-know-you build <username>
```

### Project Structure

```
├── src/
│   ├── index.ts                # CLI entry point — root Cliffy Command with subcommands
│   ├── commands/
│   │   ├── build.ts            # Fetch + analyze + save (registers as Cliffy subcommand)
│   │   ├── show.ts             # Display a saved profile using @cliffy/table
│   │   ├── list.ts             # List all profiles
│   │   ├── export.ts           # Export to JSON or Markdown
│   │   └── refresh.ts          # Re-fetch and update
│   ├── github/
│   │   ├── client.ts           # GitHub API client (rate-limit aware, uses native fetch)
│   │   ├── fetcher.ts          # Fetch user, repos, events with pagination
│   │   └── types.ts            # GitHub API response types
│   ├── analyzer/
│   │   ├── project-counts.ts   # Per-project contribution counting (commits, PRs, issues, reviews, docs, discussions)
│   │   ├── project-discovery.ts # Discover all repos (owned, forked, external) from events + search
│   │   ├── languages.ts        # Aggregate language stats
│   │   ├── activity.ts         # Compute activity level from totals
│   │   └── narrative.ts        # Generate the summary text
│   ├── schema/
│   │   └── profile.ts          # Zod schema + TypeScript types
│   ├── storage/
│   │   └── json-store.ts       # Read/write/list JSON profiles (uses Bun.file / Bun.write)
│   └── utils/
│       └── display.ts          # @cliffy/table rendering + chalk formatting helpers
├── profiles/                   # Generated profile data (gitignored)
├── package.json
├── tsconfig.json
└── README.md
```

## UX Guidelines

- Use `@cliffy/table` with `.border()` for all tabular output (per-project breakdown, profile display)
- Use `@cliffy/ansi/colors` and `chalk` for colored text: cyan for labels, green for positive metrics, yellow for warnings, red for errors
- Show progress during fetch: print lines like "🔍 Fetching repos... ✅ 42 repos found" (Bun starts fast, no need for a spinner library)
- If the user has zero public activity, be neutral — not judgmental
- Markdown export should be clean enough to paste into a README or portfolio
- Leverage Cliffy's auto-generated `--help` on every command — no need to manually maintain help text

## Edge Cases

- **User not found** → clear error: "GitHub user 'xyz' not found"
- **Zero public repos** → profile with `contributes: false`, neutral summary
- **Rate limited** → detect 403, display remaining reset time, suggest `GITHUB_TOKEN`. With exhaustive per-project counting, a token is strongly recommended for users with many repos. The tool should batch requests intelligently and show progress (e.g., "Analyzing repo 12/42...")
- **Search API rate limits** → Search API has a separate 30 requests/min limit. Implement backoff and queue requests accordingly
- **Pagination** → repos endpoint may need multiple pages for prolific users (>100 repos)
- **Forked repos** → distinguish owned vs forked, don't count forks as maintained projects unless they have diverging commits
- **Private contributions** → acknowledge that the profile only reflects public activity
- **`profiles/` directory missing** → create automatically

## Success Criteria

- [ ] `git-know-you build <username>` fetches data from GitHub and saves a valid JSON profile
- [ ] The generated `summary` field reads as a natural description of OSS involvement
- [ ] `contributes` is correctly determined based on actual public activity
- [ ] **Every project the user interacted with** is listed with per-project counts
- [ ] Per-project counts include: commits, PRs, issues created, reviews, discussions
- [ ] Totals row correctly sums all per-project counts
- [ ] External contributions (PRs/issues to repos not owned by the user) are detected via events + search API
- [ ] Language breakdown percentages are accurate across repos
- [ ] `git-know-you show` renders readable tables (owned + external) with count columns
- [ ] `git-know-you export --format=md` produces clean Markdown with tables
- [ ] Rate limiting is handled gracefully with actionable user feedback
- [ ] Works without a GitHub token; works better with one
- [ ] Search API fallback catches contributions older than the 90-day events window
