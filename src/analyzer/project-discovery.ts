import type { GitHubRepo, GitHubEvent } from "../github/types.ts";
import {
  searchUserPRs,
  searchUserIssues,
  extractRepoFromUrl,
} from "../github/fetcher.ts";

export type DiscoveredProject = {
  owner: string;
  repo: string;
  fullName: string;
  isOwned: boolean;
  isFork: boolean;
  stars: number;
  description: string | null;
  language: string | null;
};

export async function discoverProjects(
  username: string,
  repos: GitHubRepo[],
  events: GitHubEvent[],
  onProgress?: (message: string) => void
): Promise<DiscoveredProject[]> {
  const projectMap = new Map<string, DiscoveredProject>();

  // 1. Add owned repos
  for (const repo of repos) {
    const isOwned = repo.owner.login.toLowerCase() === username.toLowerCase();
    projectMap.set(repo.full_name.toLowerCase(), {
      owner: repo.owner.login,
      repo: repo.name,
      fullName: repo.full_name,
      isOwned,
      isFork: repo.fork,
      stars: repo.stargazers_count,
      description: repo.description,
      language: repo.language,
    });
  }

  // 2. Discover from events
  const eventTypes = [
    "PullRequestEvent",
    "IssuesEvent",
    "IssueCommentEvent",
    "PullRequestReviewEvent",
    "PushEvent",
  ];

  for (const event of events) {
    if (!eventTypes.includes(event.type)) continue;

    const repoName = event.repo.name;
    const [owner, repo] = repoName.split("/");
    const key = repoName.toLowerCase();

    if (!projectMap.has(key)) {
      const isOwned = owner.toLowerCase() === username.toLowerCase();
      projectMap.set(key, {
        owner,
        repo,
        fullName: repoName,
        isOwned,
        isFork: false,
        stars: 0,
        description: null,
        language: null,
      });
    }
  }

  // 3. Search fallback for PRs
  onProgress?.("Searching for PRs...");
  try {
    const prResults = await searchUserPRs(username);
    for (const item of prResults.items) {
      const repoInfo = extractRepoFromUrl(item.repository_url);
      if (repoInfo) {
        const key = `${repoInfo.owner}/${repoInfo.repo}`.toLowerCase();
        if (!projectMap.has(key)) {
          const isOwned =
            repoInfo.owner.toLowerCase() === username.toLowerCase();
          projectMap.set(key, {
            owner: repoInfo.owner,
            repo: repoInfo.repo,
            fullName: `${repoInfo.owner}/${repoInfo.repo}`,
            isOwned,
            isFork: false,
            stars: 0,
            description: null,
            language: null,
          });
        }
      }
    }
  } catch {
    // Search may fail due to rate limits, continue with what we have
  }

  // 4. Search fallback for issues
  onProgress?.("Searching for issues...");
  try {
    const issueResults = await searchUserIssues(username);
    for (const item of issueResults.items) {
      const repoInfo = extractRepoFromUrl(item.repository_url);
      if (repoInfo) {
        const key = `${repoInfo.owner}/${repoInfo.repo}`.toLowerCase();
        if (!projectMap.has(key)) {
          const isOwned =
            repoInfo.owner.toLowerCase() === username.toLowerCase();
          projectMap.set(key, {
            owner: repoInfo.owner,
            repo: repoInfo.repo,
            fullName: `${repoInfo.owner}/${repoInfo.repo}`,
            isOwned,
            isFork: false,
            stars: 0,
            description: null,
            language: null,
          });
        }
      }
    }
  } catch {
    // Search may fail due to rate limits, continue with what we have
  }

  return Array.from(projectMap.values());
}
