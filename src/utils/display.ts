import { Table } from "@cliffy/table";
import { colors } from "@cliffy/ansi/colors";
import chalk from "chalk";
import type { Profile, Project } from "../schema/profile.ts";
import { getActivityDescription } from "../analyzer/activity.ts";

export function printSeparator(): void {
  console.log(colors.gray("━".repeat(60)));
}

export function printHeader(text: string): void {
  console.log(colors.bold.cyan(text));
}

export function printSuccess(text: string): void {
  console.log(colors.green(`✅ ${text}`));
}

export function printError(text: string): void {
  console.log(colors.red(`❌ ${text}`));
}

export function printWarning(text: string): void {
  console.log(colors.yellow(`⚠️  ${text}`));
}

export function printProgress(label: string, result?: string): void {
  if (result) {
    console.log(`   ${label}... ${colors.green("✅")} ${result}`);
  } else {
    console.log(`   ${label}...`);
  }
}

export function displayProfile(profile: Profile): void {
  const { username, open_source: os } = profile;

  printSeparator();
  console.log();
  printHeader(`📋 Open Source Contribution Profile: ${username}`);
  console.log();

  // Contribution status
  const statusColor = os.contributes ? chalk.green : chalk.yellow;
  const activityDesc = getActivityDescription(os.activity_level);

  console.log(`  ${chalk.bold("Status:")} ${statusColor(activityDesc)}`);
  console.log();

  // Summary
  console.log(chalk.bold("  Summary:"));
  const summaryLines = wrapText(os.summary, 70);
  for (const line of summaryLines) {
    console.log(`  ${line}`);
  }
  console.log();

  // Language breakdown
  if (Object.keys(os.languages).length > 0) {
    const langText = Object.entries(os.languages)
      .map(([lang, pct]) => `${lang} (${pct}%)`)
      .join(", ");
    console.log(`  ${chalk.cyan("Primary Languages:")}          ${langText}`);
  }

  // Activity level
  console.log(
    `  ${chalk.cyan("Activity Level:")}             ${os.stats.recent_events_count} contributions in recent history`
  );
  console.log();

  // Per-project breakdown
  const ownedProjects = os.projects.filter((p) => p.role === "owner");
  const externalProjects = os.projects.filter((p) => p.role === "contributor");

  console.log(chalk.bold("  📊 Per-Project Breakdown:"));
  console.log();

  // Owned projects table
  if (ownedProjects.length > 0) {
    console.log(chalk.bold("  Owned Projects"));
    displayProjectTable(ownedProjects, true);
    console.log();
  }

  // External contributions table
  if (externalProjects.length > 0) {
    console.log(chalk.bold("  External Contributions"));
    displayProjectTable(externalProjects, false);
    console.log();
  }

  // Totals
  const t = os.totals;
  console.log(
    chalk.bold(
      `  Totals:  ${t.commits} commits · ${t.pull_requests} PRs · ${t.issues_created} issues · ${t.reviews} reviews · ${t.discussions} discussions`
    )
  );
  console.log();

  printSeparator();
}

function displayProjectTable(projects: Project[], showStars: boolean): void {
  const headers = showStars
    ? ["Project", "⭐", "Commits", "PRs", "Issues", "Reviews", "Discussions"]
    : ["Project", "Commits", "PRs", "Issues", "Reviews", "Discussions"];

  const rows = projects.map((p) => {
    const baseRow = [
      truncate(p.repo, 20),
      p.counts.commits.toString(),
      p.counts.pull_requests.toString(),
      p.counts.issues_created.toString(),
      p.counts.reviews.toString(),
      p.counts.discussions.toString(),
    ];

    if (showStars) {
      return [baseRow[0], p.stars.toString(), ...baseRow.slice(1)];
    }

    return baseRow;
  });

  const table = new Table()
    .header(headers)
    .body(rows)
    .border()
    .padding(1);

  // Indent the table
  const tableStr = table.toString();
  const indentedTable = tableStr
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");

  console.log(indentedTable);
}

export function displayProfileList(usernames: string[]): void {
  if (usernames.length === 0) {
    console.log(chalk.yellow("No saved profiles found."));
    console.log(
      chalk.gray("Run `git-know-you build <username>` to create a profile.")
    );
    return;
  }

  console.log(chalk.bold(`📁 Saved Profiles (${usernames.length}):`));
  console.log();

  for (const username of usernames) {
    console.log(`  • ${username}`);
  }
}

export function exportToMarkdown(profile: Profile): string {
  const { username, github, open_source: os } = profile;
  const lines: string[] = [];

  lines.push(`# Open Source Profile: ${username}`);
  lines.push("");
  lines.push(`*Generated: ${new Date(profile.fetched_at).toLocaleDateString()}*`);
  lines.push("");

  // GitHub info
  if (github.name || github.bio) {
    if (github.name) lines.push(`**${github.name}**`);
    if (github.bio) lines.push(`> ${github.bio}`);
    lines.push("");
  }

  // Summary
  lines.push("## Summary");
  lines.push("");
  lines.push(os.summary);
  lines.push("");

  // Stats
  lines.push("## Statistics");
  lines.push("");
  lines.push(`- **Contribution Status:** ${os.contributes ? "Active" : "Inactive"}`);
  lines.push(`- **Activity Level:** ${getActivityDescription(os.activity_level)}`);
  lines.push(`- **Public Repositories:** ${github.public_repos}`);
  lines.push(`- **Total Stars:** ${os.stats.total_stars}`);
  lines.push(`- **Account Age:** ${os.stats.account_age_years.toFixed(1)} years`);
  lines.push("");

  // Languages
  if (Object.keys(os.languages).length > 0) {
    lines.push("## Languages");
    lines.push("");
    for (const [lang, pct] of Object.entries(os.languages)) {
      lines.push(`- ${lang}: ${pct}%`);
    }
    lines.push("");
  }

  // Owned projects
  const ownedProjects = os.projects.filter((p) => p.role === "owner");
  if (ownedProjects.length > 0) {
    lines.push("## Owned Projects");
    lines.push("");
    lines.push("| Project | ⭐ | Commits | PRs | Issues | Reviews |");
    lines.push("|---------|-----|---------|-----|--------|---------|");
    for (const p of ownedProjects) {
      lines.push(
        `| ${p.repo} | ${p.stars} | ${p.counts.commits} | ${p.counts.pull_requests} | ${p.counts.issues_created} | ${p.counts.reviews} |`
      );
    }
    lines.push("");
  }

  // External contributions
  const externalProjects = os.projects.filter((p) => p.role === "contributor");
  if (externalProjects.length > 0) {
    lines.push("## External Contributions");
    lines.push("");
    lines.push("| Project | PRs | Issues | Reviews |");
    lines.push("|---------|-----|--------|---------|");
    for (const p of externalProjects) {
      lines.push(
        `| ${p.repo} | ${p.counts.pull_requests} | ${p.counts.issues_created} | ${p.counts.reviews} |`
      );
    }
    lines.push("");
  }

  // Totals
  lines.push("## Totals");
  lines.push("");
  lines.push(`- **Commits:** ${os.totals.commits}`);
  lines.push(`- **Pull Requests:** ${os.totals.pull_requests}`);
  lines.push(`- **Issues Created:** ${os.totals.issues_created}`);
  lines.push(`- **Code Reviews:** ${os.totals.reviews}`);
  lines.push(`- **Discussions:** ${os.totals.discussions}`);
  lines.push("");

  return lines.join("\n");
}

function wrapText(text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= maxWidth) {
      currentLine += (currentLine ? " " : "") + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + "…";
}
