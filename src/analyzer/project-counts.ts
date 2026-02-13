import { githubClient } from "../github/client.ts";
import {
  searchRepoPRs,
  searchRepoIssues,
  searchRepoReviews,
  searchRepoDiscussions,
  fetchCommitsWithFiles,
} from "../github/fetcher.ts";
import type { ProjectCounts } from "../schema/profile.ts";
import type { DiscoveredProject } from "./project-discovery.ts";

const DOC_PATTERNS = [
  /^docs\//i,
  /\.md$/i,
  /\.rst$/i,
  /^readme/i,
  /^changelog/i,
  /^contributing/i,
  /^license/i,
];

function isDocFile(filename: string): boolean {
  return DOC_PATTERNS.some((pattern) => pattern.test(filename));
}

export async function getProjectCounts(
  username: string,
  project: DiscoveredProject,
  onProgress?: (message: string) => void
): Promise<ProjectCounts> {
  const { owner, repo } = project;

  onProgress?.(`  Analyzing ${owner}/${repo}...`);

  // Get commit count
  const commits = await githubClient.getCommitCount(owner, repo, username);

  // Get docs commits by fetching actual commits and checking files
  let docsCommits = 0;
  if (commits > 0 && project.isOwned) {
    try {
      const commitDetails = await fetchCommitsWithFiles(
        owner,
        repo,
        username,
        50
      );
      for (const commit of commitDetails) {
        if (commit.files?.some((f) => isDocFile(f.filename))) {
          docsCommits++;
        }
      }
      // Estimate total docs commits based on sample
      if (commitDetails.length > 0 && commits > 50) {
        const ratio = docsCommits / commitDetails.length;
        docsCommits = Math.round(commits * ratio);
      }
    } catch {
      // If fetching commit details fails, estimate based on commit count
      docsCommits = Math.round(commits * 0.05);
    }
  }

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
    docs_commits: docsCommits,
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
      docs_commits: acc.docs_commits + counts.docs_commits,
      discussions: acc.discussions + counts.discussions,
    }),
    {
      commits: 0,
      pull_requests: 0,
      issues_created: 0,
      reviews: 0,
      docs_commits: 0,
      discussions: 0,
    }
  );
}
