import { Command } from "@cliffy/command";
import chalk from "chalk";
import { profileExists } from "../storage/json-store.ts";
import { printError, printWarning } from "../utils/display.ts";

// Import the build command action logic
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
import { saveProfile } from "../storage/json-store.ts";
import { displayProfile } from "../utils/display.ts";
import type { Profile, Project } from "../schema/profile.ts";

export const refreshCommand = new Command()
  .name("refresh")
  .description("Re-fetch and update an existing profile")
  .arguments("<username:string>")
  .action(async (_options, username: string) => {
    const exists = await profileExists(username);

    if (!exists) {
      printError(`No existing profile found for '${username}'`);
      console.log();
      console.log(
        `Run \`dev-profile build ${username}\` to create a new profile.`
      );
      process.exit(1);
    }

    console.log();
    console.log(chalk.cyan(`🔄 Refreshing profile for ${username}...`));

    if (!githubClient.hasToken()) {
      printWarning(
        "No GITHUB_TOKEN found. Rate limits will be restricted (60 req/hr)."
      );
      console.log();
    }

    try {
      // Fetch user info
      console.log(chalk.gray("   Fetching user info..."));
      const user = await fetchUser(username);

      // Fetch repos
      console.log(chalk.gray("   Fetching repos..."));
      const repos = await fetchRepos(username);

      // Fetch events
      console.log(chalk.gray("   Fetching events..."));
      const events = await fetchEvents(username);

      // Discover projects
      console.log(chalk.gray("   Discovering projects..."));
      const discoveredProjects = await discoverProjects(username, repos, events);

      // Analyze each project
      console.log(chalk.cyan("📊 Analyzing contributions..."));

      const projects: Project[] = [];
      let analyzed = 0;

      for (const discovered of discoveredProjects) {
        analyzed++;

        try {
          const counts = await getProjectCounts(username, discovered, (msg) =>
            console.log(
              chalk.gray(
                `   [${analyzed}/${discoveredProjects.length}] ${msg}`
              )
            )
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
            printWarning(`Rate limit reached. Partial refresh completed.`);
            break;
          }
        }
      }

      // Aggregate languages
      const languages = await aggregateLanguages(discoveredProjects);

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

      // Display and save
      displayProfile(profile);

      const filePath = await saveProfile(profile);
      console.log();
      console.log(chalk.green(`💾 Profile updated at ${filePath}`));
    } catch (error) {
      if (error instanceof RateLimitError) {
        printError(error.message);
      } else if (error instanceof Error) {
        printError(error.message);
      } else {
        printError("An unexpected error occurred");
      }
      process.exit(1);
    }
  });
