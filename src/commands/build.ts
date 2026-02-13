import { Command } from "@cliffy/command";
import chalk from "chalk";
import { fetchUser, fetchRepos, fetchEvents } from "../github/fetcher.ts";
import { githubClient, RateLimitError } from "../github/client.ts";
import { discoverProjects } from "../analyzer/project-discovery.ts";
import {
  getProjectCounts,
  isNonZeroCounts,
  sumCounts,
} from "../analyzer/project-counts.ts";
import { aggregateLanguages } from "../analyzer/languages.ts";
import { computeActivityLevel } from "../analyzer/activity.ts";
import { generateNarrative } from "../analyzer/narrative.ts";
import { saveProfile, getProfilePath } from "../storage/json-store.ts";
import {
  printError,
  printProgress,
  printWarning,
  displayProfile,
} from "../utils/display.ts";
import type { Profile, Project } from "../schema/profile.ts";

export const buildCommand = new Command()
  .name("build")
  .description("Fetch GitHub data and build a developer profile")
  .arguments("<username:string>")
  .action(async (_options, username: string) => {
    console.log();
    console.log(chalk.cyan(`🔍 Fetching GitHub data for ${username}...`));

    if (!githubClient.hasToken()) {
      printWarning(
        "No GITHUB_TOKEN found. Rate limits will be restricted (60 req/hr)."
      );
      console.log(
        chalk.gray("   Set GITHUB_TOKEN env var for higher limits (5000 req/hr).")
      );
      console.log();
    }

    try {
      // Fetch user info
      printProgress("Fetching user info");
      const user = await fetchUser(username);
      printProgress("Fetching user info", `${user.name || username}`);

      // Fetch repos
      printProgress("Fetching repos");
      const repos = await fetchRepos(username);
      printProgress("Fetching repos", `${repos.length} repos`);

      // Fetch events
      printProgress("Fetching events");
      const events = await fetchEvents(username);
      printProgress("Fetching events", `${events.length} events`);

      // Discover projects
      console.log();
      console.log(chalk.cyan("🔎 Discovering projects..."));
      const discoveredProjects = await discoverProjects(
        username,
        repos,
        events,
        (msg) => console.log(chalk.gray(`   ${msg}`))
      );
      console.log(
        chalk.gray(`   Found ${discoveredProjects.length} projects to analyze`)
      );

      // Analyze each project
      console.log();
      console.log(chalk.cyan("📊 Analyzing contributions..."));

      const projects: Project[] = [];
      let analyzed = 0;

      for (const discovered of discoveredProjects) {
        analyzed++;
        const progress = `[${analyzed}/${discoveredProjects.length}]`;

        try {
          const counts = await getProjectCounts(username, discovered, (msg) =>
            console.log(chalk.gray(`   ${progress} ${msg}`))
          );

          if (isNonZeroCounts(counts)) {
            projects.push({
              repo: discovered.fullName,
              role: discovered.isOwned ? "owner" : "contributor",
              stars: discovered.stars,
              description: discovered.description,
              language: discovered.language,
              counts,
            });
          }
        } catch (error) {
          if (error instanceof RateLimitError) {
            printWarning(
              `Rate limit reached. Analyzed ${analyzed}/${discoveredProjects.length} projects.`
            );
            printWarning(`Resets at ${error.resetTime.toLocaleTimeString()}`);
            break;
          }
          // Skip individual project errors
        }
      }

      console.log(
        chalk.gray(`   ${projects.length} projects with contributions`)
      );

      // Aggregate languages
      console.log();
      console.log(chalk.cyan("🔤 Aggregating languages..."));
      const languages = await aggregateLanguages(discoveredProjects, (msg) =>
        console.log(chalk.gray(msg))
      );

      // Compute totals and activity
      const totals = sumCounts(projects.map((p) => p.counts));
      const activityLevel = computeActivityLevel(totals);
      const contributes = projects.length > 0 && activityLevel !== "inactive";

      // Determine maintained projects
      const maintainedProjects = projects
        .filter((p) => p.role === "owner" && (p.stars > 0 || p.counts.commits > 10))
        .map((p) => p.repo);

      // Calculate stats
      const totalStars = projects
        .filter((p) => p.role === "owner")
        .reduce((sum, p) => sum + p.stars, 0);

      const totalForks = repos.reduce((sum, r) => sum + r.forks_count, 0);

      const accountAgeYears =
        (Date.now() - new Date(user.created_at).getTime()) /
        (1000 * 60 * 60 * 24 * 365);

      // Generate narrative
      const summary = generateNarrative({
        username,
        activityLevel,
        projects,
        totals,
        languages,
        maintainedProjects,
        totalStars,
      });

      // Build profile
      const profile: Profile = {
        username,
        fetched_at: new Date().toISOString(),
        github: {
          name: user.name,
          bio: user.bio,
          company: user.company,
          location: user.location,
          public_repos: user.public_repos,
          followers: user.followers,
          created_at: user.created_at,
        },
        open_source: {
          contributes,
          activity_level: activityLevel,
          summary,
          projects: projects.sort((a, b) => {
            // Sort by role (owner first), then by total activity
            if (a.role !== b.role) return a.role === "owner" ? -1 : 1;
            const aTotal = Object.values(a.counts).reduce((s, v) => s + v, 0);
            const bTotal = Object.values(b.counts).reduce((s, v) => s + v, 0);
            return bTotal - aTotal;
          }),
          totals,
          languages,
          maintained_projects: maintainedProjects,
          stats: {
            total_stars: totalStars,
            total_forks: totalForks,
            recent_events_count: events.length,
            account_age_years: Math.round(accountAgeYears * 10) / 10,
          },
        },
      };

      // Display profile
      displayProfile(profile);

      // Save profile
      const filePath = await saveProfile(profile);
      console.log();
      console.log(chalk.green(`💾 Profile saved to ${filePath}`));
    } catch (error) {
      if (error instanceof RateLimitError) {
        printError(error.message);
        if (!githubClient.hasToken()) {
          console.log();
          console.log(
            chalk.yellow(
              "Tip: Set GITHUB_TOKEN environment variable for higher rate limits."
            )
          );
          console.log(chalk.gray("  export GITHUB_TOKEN=your_token_here"));
        }
      } else if (error instanceof Error) {
        printError(error.message);
      } else {
        printError("An unexpected error occurred");
      }
      process.exit(1);
    }
  });
