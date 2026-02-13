import type {
  ActivityLevel,
  Project,
  ProjectCounts,
} from "../schema/profile.ts";
import { getTopLanguages } from "./languages.ts";

type NarrativeInput = {
  username: string;
  activityLevel: ActivityLevel;
  projects: Project[];
  totals: ProjectCounts;
  languages: Record<string, number>;
  maintainedProjects: string[];
  totalStars: number;
};

export function generateNarrative(input: NarrativeInput): string {
  const {
    username,
    activityLevel,
    projects,
    totals,
    languages,
    maintainedProjects,
    totalStars,
  } = input;

  const ownedProjects = projects.filter((p) => p.role === "owner");
  const externalProjects = projects.filter((p) => p.role === "contributor");
  const topLanguages = getTopLanguages(languages, 3);

  // No contributions
  if (activityLevel === "inactive") {
    return `${username} has a GitHub account but has not yet contributed to public open source projects.`;
  }

  // Occasional contributor
  if (activityLevel === "occasional") {
    const contributionTypes = getContributionTypes(totals);
    const languageText =
      topLanguages.length > 0
        ? `Their work focuses on ${formatList(topLanguages)}.`
        : "";

    return `${username} has contributed to open source, primarily through ${contributionTypes} on ${projects.length} public ${pluralize("repository", projects.length)}. ${languageText}`.trim();
  }

  // Active or prolific contributor
  const notableProjects = externalProjects
    .sort((a, b) => b.stars - a.stars)
    .slice(0, 3)
    .map((p) => p.repo.split("/").pop() || p.repo);

  const parts: string[] = [];

  parts.push(
    `${username} is an ${activityLevel} open source contributor with ${ownedProjects.length} public ${pluralize("repository", ownedProjects.length)}`
  );

  if (externalProjects.length > 0) {
    const notableText =
      notableProjects.length > 0
        ? ` including ${formatList(notableProjects)}`
        : "";
    parts.push(
      `and contributions to ${externalProjects.length} external ${pluralize("project", externalProjects.length)}${notableText}`
    );
  }

  parts.push(".");

  if (topLanguages.length > 0) {
    parts.push(`They primarily work in ${formatList(topLanguages)}.`);
  }

  if (maintainedProjects.length > 0 && totalStars > 0) {
    parts.push(
      `They maintain ${maintainedProjects.length} ${pluralize("project", maintainedProjects.length)} with a combined ${totalStars}+ stars.`
    );
  }

  const contributionTypes = getContributionTypes(totals);
  if (contributionTypes) {
    parts.push(`Their contributions span ${contributionTypes}.`);
  }

  return parts.join(" ");
}

function getContributionTypes(totals: ProjectCounts): string {
  const types: string[] = [];

  if (totals.commits > 0) types.push("code");
  if (totals.issues_created > 0) types.push("issue reporting");
  if (totals.reviews > 0) types.push("code review");
  if (totals.discussions > 0) types.push("discussion");

  return formatList(types);
}

function formatList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function pluralize(word: string, count: number): string {
  if (count === 1) return word;
  if (word === "repository") return "repositories";
  return `${word}s`;
}
