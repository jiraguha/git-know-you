import { fetchRepoLanguages } from "../github/fetcher.ts";
import type { DiscoveredProject } from "./project-discovery.ts";

export async function aggregateLanguages(
  projects: DiscoveredProject[],
  onProgress?: (message: string) => void
): Promise<Record<string, number>> {
  const languageBytes: Record<string, number> = {};

  // Only fetch languages for owned projects to save API calls
  const ownedProjects = projects.filter((p) => p.isOwned);

  for (let i = 0; i < ownedProjects.length; i++) {
    const project = ownedProjects[i];
    onProgress?.(
      `  Fetching languages ${i + 1}/${ownedProjects.length}: ${project.fullName}`
    );

    try {
      const languages = await fetchRepoLanguages(project.owner, project.repo);
      for (const [lang, bytes] of Object.entries(languages)) {
        languageBytes[lang] = (languageBytes[lang] || 0) + bytes;
      }
    } catch {
      // Skip repos where we can't fetch languages
    }
  }

  // Convert to percentages
  const totalBytes = Object.values(languageBytes).reduce((a, b) => a + b, 0);

  if (totalBytes === 0) {
    return {};
  }

  const percentages: Record<string, number> = {};
  let otherPercent = 0;

  const sortedLanguages = Object.entries(languageBytes)
    .map(([lang, bytes]) => ({
      lang,
      percent: (bytes / totalBytes) * 100,
    }))
    .sort((a, b) => b.percent - a.percent);

  for (const { lang, percent } of sortedLanguages) {
    if (percent >= 5) {
      percentages[lang] = Math.round(percent * 10) / 10;
    } else {
      otherPercent += percent;
    }
  }

  if (otherPercent > 0) {
    percentages["Other"] = Math.round(otherPercent * 10) / 10;
  }

  return percentages;
}

export function getTopLanguages(
  languages: Record<string, number>,
  count = 3
): string[] {
  return Object.entries(languages)
    .filter(([lang]) => lang !== "Other")
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([lang]) => lang);
}
