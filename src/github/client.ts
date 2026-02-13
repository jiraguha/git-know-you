import type { RateLimitInfo } from "./types.ts";

const GITHUB_API_BASE = "https://api.github.com";

export class GitHubApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string
  ) {
    super(message);
    this.name = "GitHubApiError";
  }
}

export class RateLimitError extends Error {
  constructor(
    public resetTime: Date,
    public isSearchApi: boolean
  ) {
    const resetStr = resetTime.toLocaleTimeString();
    const apiType = isSearchApi ? "Search API" : "Core API";
    super(`${apiType} rate limit exceeded. Resets at ${resetStr}`);
    this.name = "RateLimitError";
  }
}

export class GitHubClient {
  private token: string | undefined;
  private rateLimitInfo: RateLimitInfo | null = null;
  private searchRateLimitInfo: RateLimitInfo | null = null;
  private lastSearchTime = 0;
  private searchRequestCount = 0;

  constructor() {
    this.token = Bun.env.GITHUB_TOKEN;
  }

  hasToken(): boolean {
    return !!this.token;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "dev-profile-cli",
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  private updateRateLimit(headers: Headers, isSearch: boolean): void {
    const limit = headers.get("x-ratelimit-limit");
    const remaining = headers.get("x-ratelimit-remaining");
    const reset = headers.get("x-ratelimit-reset");
    const used = headers.get("x-ratelimit-used");

    if (limit && remaining && reset && used) {
      const info: RateLimitInfo = {
        limit: parseInt(limit, 10),
        remaining: parseInt(remaining, 10),
        reset: parseInt(reset, 10),
        used: parseInt(used, 10),
      };

      if (isSearch) {
        this.searchRateLimitInfo = info;
      } else {
        this.rateLimitInfo = info;
      }
    }
  }

  getRateLimitInfo(): RateLimitInfo | null {
    return this.rateLimitInfo;
  }

  getSearchRateLimitInfo(): RateLimitInfo | null {
    return this.searchRateLimitInfo;
  }

  private async throttleSearch(): Promise<void> {
    // Search API: 30 requests per minute for authenticated, 10 for unauthenticated
    const maxPerMinute = this.token ? 30 : 10;
    const minInterval = 60000 / maxPerMinute;

    const now = Date.now();
    const elapsed = now - this.lastSearchTime;

    if (elapsed < minInterval) {
      await new Promise((resolve) =>
        setTimeout(resolve, minInterval - elapsed)
      );
    }

    this.lastSearchTime = Date.now();
    this.searchRequestCount++;
  }

  async fetch<T>(
    endpoint: string,
    options: { isSearch?: boolean } = {}
  ): Promise<T> {
    const { isSearch = false } = options;

    if (isSearch) {
      await this.throttleSearch();
    }

    const url = endpoint.startsWith("http")
      ? endpoint
      : `${GITHUB_API_BASE}${endpoint}`;

    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    this.updateRateLimit(response.headers, isSearch);

    if (response.status === 403) {
      const resetHeader = response.headers.get("x-ratelimit-reset");
      const resetTime = resetHeader
        ? new Date(parseInt(resetHeader, 10) * 1000)
        : new Date(Date.now() + 60000);

      throw new RateLimitError(resetTime, isSearch);
    }

    if (response.status === 404) {
      throw new GitHubApiError(404, "Not Found", "Resource not found");
    }

    if (!response.ok) {
      throw new GitHubApiError(
        response.status,
        response.statusText,
        `GitHub API error: ${response.statusText}`
      );
    }

    return response.json() as Promise<T>;
  }

  async fetchWithPagination<T>(
    endpoint: string,
    maxPages = 10
  ): Promise<T[]> {
    const results: T[] = [];
    let page = 1;
    let hasMore = true;

    const separator = endpoint.includes("?") ? "&" : "?";

    while (hasMore && page <= maxPages) {
      const url = `${endpoint}${separator}page=${page}&per_page=100`;
      const response = await fetch(`${GITHUB_API_BASE}${url}`, {
        headers: this.getHeaders(),
      });

      this.updateRateLimit(response.headers, false);

      if (response.status === 403) {
        const resetHeader = response.headers.get("x-ratelimit-reset");
        const resetTime = resetHeader
          ? new Date(parseInt(resetHeader, 10) * 1000)
          : new Date(Date.now() + 60000);

        throw new RateLimitError(resetTime, false);
      }

      if (!response.ok) {
        throw new GitHubApiError(
          response.status,
          response.statusText,
          `GitHub API error: ${response.statusText}`
        );
      }

      const data = (await response.json()) as T[];

      if (data.length === 0) {
        hasMore = false;
      } else {
        results.push(...data);
        page++;

        if (data.length < 100) {
          hasMore = false;
        }
      }
    }

    return results;
  }

  async getCommitCount(
    owner: string,
    repo: string,
    author: string
  ): Promise<number> {
    const url = `/repos/${owner}/${repo}/commits?author=${author}&per_page=1`;

    const response = await fetch(`${GITHUB_API_BASE}${url}`, {
      headers: this.getHeaders(),
    });

    this.updateRateLimit(response.headers, false);

    if (response.status === 409 || response.status === 404) {
      // Empty repo or not found
      return 0;
    }

    if (response.status === 403) {
      const resetHeader = response.headers.get("x-ratelimit-reset");
      const resetTime = resetHeader
        ? new Date(parseInt(resetHeader, 10) * 1000)
        : new Date(Date.now() + 60000);

      throw new RateLimitError(resetTime, false);
    }

    if (!response.ok) {
      return 0;
    }

    // Parse the Link header to find the last page number
    const linkHeader = response.headers.get("link");
    if (!linkHeader) {
      const data = await response.json();
      return Array.isArray(data) ? data.length : 0;
    }

    const lastPageMatch = linkHeader.match(/page=(\d+)>; rel="last"/);
    if (lastPageMatch) {
      return parseInt(lastPageMatch[1], 10);
    }

    const data = await response.json();
    return Array.isArray(data) ? data.length : 0;
  }
}

export const githubClient = new GitHubClient();
