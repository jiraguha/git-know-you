import { githubClient, GitHubApiError } from "./client.ts";
import type {
  GitHubUser,
  GitHubRepo,
  GitHubEvent,
  GitHubSearchResult,
  GitHubLanguages,
  GitHubCommit,
} from "./types.ts";

export async function fetchUser(username: string): Promise<GitHubUser> {
  try {
    return await githubClient.fetch<GitHubUser>(`/users/${username}`);
  } catch (error) {
    if (error instanceof GitHubApiError && error.status === 404) {
      throw new Error(`GitHub user '${username}' not found`);
    }
    throw error;
  }
}

export async function fetchRepos(username: string): Promise<GitHubRepo[]> {
  return githubClient.fetchWithPagination<GitHubRepo>(
    `/users/${username}/repos?type=all&sort=updated`
  );
}

export async function fetchEvents(username: string): Promise<GitHubEvent[]> {
  // Events API returns at most 300 events or 90 days
  return githubClient.fetchWithPagination<GitHubEvent>(
    `/users/${username}/events/public`,
    3 // Max 3 pages of 100 = 300 events
  );
}

export async function fetchRepoLanguages(
  owner: string,
  repo: string
): Promise<GitHubLanguages> {
  try {
    return await githubClient.fetch<GitHubLanguages>(
      `/repos/${owner}/${repo}/languages`
    );
  } catch {
    return {};
  }
}

export async function fetchCommitsWithFiles(
  owner: string,
  repo: string,
  author: string,
  maxCommits = 100
): Promise<GitHubCommit[]> {
  try {
    const commits = await githubClient.fetchWithPagination<GitHubCommit>(
      `/repos/${owner}/${repo}/commits?author=${author}`,
      Math.ceil(maxCommits / 100)
    );
    return commits.slice(0, maxCommits);
  } catch {
    return [];
  }
}

export async function searchUserPRs(
  username: string
): Promise<GitHubSearchResult> {
  return githubClient.fetch<GitHubSearchResult>(
    `/search/issues?q=type:pr+author:${username}&per_page=100`,
    { isSearch: true }
  );
}

export async function searchUserIssues(
  username: string
): Promise<GitHubSearchResult> {
  return githubClient.fetch<GitHubSearchResult>(
    `/search/issues?q=type:issue+author:${username}&per_page=100`,
    { isSearch: true }
  );
}

export async function searchRepoPRs(
  username: string,
  owner: string,
  repo: string
): Promise<number> {
  try {
    const result = await githubClient.fetch<GitHubSearchResult>(
      `/search/issues?q=type:pr+author:${username}+repo:${owner}/${repo}`,
      { isSearch: true }
    );
    return result.total_count;
  } catch {
    return 0;
  }
}

export async function searchRepoIssues(
  username: string,
  owner: string,
  repo: string
): Promise<number> {
  try {
    const result = await githubClient.fetch<GitHubSearchResult>(
      `/search/issues?q=type:issue+author:${username}+repo:${owner}/${repo}`,
      { isSearch: true }
    );
    return result.total_count;
  } catch {
    return 0;
  }
}

export async function searchRepoReviews(
  username: string,
  owner: string,
  repo: string
): Promise<number> {
  try {
    const result = await githubClient.fetch<GitHubSearchResult>(
      `/search/issues?q=type:pr+reviewed-by:${username}+repo:${owner}/${repo}`,
      { isSearch: true }
    );
    return result.total_count;
  } catch {
    return 0;
  }
}

export async function searchRepoDiscussions(
  username: string,
  owner: string,
  repo: string
): Promise<number> {
  try {
    const result = await githubClient.fetch<GitHubSearchResult>(
      `/search/issues?q=type:issue+commenter:${username}+repo:${owner}/${repo}+-author:${username}`,
      { isSearch: true }
    );
    return result.total_count;
  } catch {
    return 0;
  }
}

export function extractRepoFromUrl(repositoryUrl: string): {
  owner: string;
  repo: string;
} | null {
  const match = repositoryUrl.match(/repos\/([^/]+)\/([^/]+)/);
  if (match) {
    return { owner: match[1], repo: match[2] };
  }
  return null;
}
