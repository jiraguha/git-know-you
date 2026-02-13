export type GitHubUser = {
  login: string;
  name: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  public_repos: number;
  followers: number;
  created_at: string;
};

export type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
  };
  description: string | null;
  fork: boolean;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  pushed_at: string | null;
  created_at: string;
};

export type GitHubEvent = {
  id: string;
  type: string;
  repo: {
    id: number;
    name: string;
  };
  payload: {
    action?: string;
    pull_request?: {
      id: number;
      number: number;
    };
    issue?: {
      id: number;
      number: number;
    };
    commits?: Array<{
      sha: string;
      message: string;
    }>;
  };
  created_at: string;
};

export type GitHubSearchResult = {
  total_count: number;
  incomplete_results: boolean;
  items: Array<{
    id: number;
    number: number;
    title: string;
    repository_url: string;
    html_url: string;
    created_at: string;
  }>;
};

export type GitHubCommit = {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  files?: Array<{
    filename: string;
    status: string;
    additions: number;
    deletions: number;
  }>;
};

export type GitHubLanguages = Record<string, number>;

export type RateLimitInfo = {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
};
