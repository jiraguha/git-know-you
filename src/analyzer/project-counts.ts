import { githubClient } from "../github/client.ts";
import {
  searchRepoPRs,
  searchRepoIssues,
  searchRepoReviews,
  searchRepoDiscussions,
} from "../github/fetcher.ts";
import type { ProjectCounts } from "../schema/profile.ts";
import type { DiscoveredProject } from "./project-discovery.ts";

export async function getProjectCounts(
  username: string,
  project: DiscoveredProject,
  onProgress?: (message: string) => void
): Promise<ProjectCounts> {
  const { owner, repo } = project;

  onProgress?.(`  Analyzing ${owner}/${repo}...`);

  // Get commit count
  const commits = await githubClient.getCommitCount(owner, repo, username);

  // Get PR count
  const pullRequests = await searchRepoPRs(username, owner, repo);

  // Get issues count
  const issuesCreated = await searchRepoIssues(username, owner, repo);

  // Get reviews count
  const reviews = await searchRepoReviews(username, owner, repo);

  // Get discussions count
  const discussions = await searchRepoDiscussions(username, owner, repo);

  return {
    commits,
    pull_requests: pullRequests,
    issues_created: issuesCreated,
    reviews,
    discussions,
  };
}

export function isNonZeroCounts(counts: ProjectCounts): boolean {
  return (
    counts.commits > 0 ||
    counts.pull_requests > 0 ||
    counts.issues_created > 0 ||
    counts.reviews > 0 ||
    counts.discussions > 0
  );
}

export function sumCounts(countsList: ProjectCounts[]): ProjectCounts {
  return countsList.reduce(
    (acc, counts) => ({
      commits: acc.commits + counts.commits,
      pull_requests: acc.pull_requests + counts.pull_requests,
      issues_created: acc.issues_created + counts.issues_created,
      reviews: acc.reviews + counts.reviews,
      discussions: acc.discussions + counts.discussions,
    }),
    {
      commits: 0,
      pull_requests: 0,
      issues_created: 0,
      reviews: 0,
      discussions: 0,
    }
  );
}
