// GitHub API client with Rate Limit Protection (Prompt 6)
// + Data Quality Filters (Prompt 8)
// Features: rate limit header detection, exponential retry with backoff,
// 403/429 handling, request throttling, bot/noise filtering

export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

export interface GitHubRepo {
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  size: number;
  fork: boolean;
  topics: string[];
  has_issues: boolean;
  open_issues_count: number;
  default_branch: string;
}

export interface GitHubEvent {
  type: string;
  created_at: string;
  repo: { name: string };
  payload: Record<string, unknown>;
}

export interface CommitWeek {
  week: number;
  total: number;
  days: number[];
}

export interface ContributorStats {
  author: { login: string } | null;
  total: number;
  weeks: { w: number; a: number; d: number; c: number }[];
}

export type LanguageBreakdown = Record<string, number>;

export interface GitHubDataset {
  user: GitHubUser;
  repos: GitHubRepo[];
  events: GitHubEvent[];
  repoDetails: RepoDetail[];
}

export interface RepoDetail {
  repoName: string;
  commitActivity: CommitWeek[];
  contributors: ContributorStats[];
  languages: LanguageBreakdown;
}

// ─── Rate Limit State ──────────────────────────────────────────

interface RateLimitInfo {
  remaining: number;
  limit: number;
  resetAt: number; // Unix timestamp (seconds)
}

let rateLimitState: RateLimitInfo = {
  remaining: 60,
  limit: 60,
  resetAt: 0,
};

// ─── Throttle Queue ────────────────────────────────────────────
// Ensures we don't fire all requests simultaneously

let lastRequestTime = 0;
const MIN_REQUEST_GAP_MS = 100; // 100ms between requests

async function throttle(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_REQUEST_GAP_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_REQUEST_GAP_MS - elapsed));
  }
  lastRequestTime = Date.now();
}

// ─── Rate Limit Header Detection ───────────────────────────────

function parseRateLimitHeaders(res: Response): void {
  const remaining = res.headers.get("x-ratelimit-remaining");
  const limit = res.headers.get("x-ratelimit-limit");
  const reset = res.headers.get("x-ratelimit-reset");

  if (remaining !== null) rateLimitState.remaining = parseInt(remaining, 10);
  if (limit !== null) rateLimitState.limit = parseInt(limit, 10);
  if (reset !== null) rateLimitState.resetAt = parseInt(reset, 10);
}

function getWaitTimeUntilReset(): number {
  if (rateLimitState.remaining > 0) return 0;
  const nowSec = Math.floor(Date.now() / 1000);
  const waitSec = Math.max(rateLimitState.resetAt - nowSec, 1);
  return waitSec * 1000;
}

// ─── Exponential Retry with Backoff ────────────────────────────

const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 1000;

const BASE = "https://api.github.com";
const HEADERS = { Accept: "application/vnd.github.v3+json" };

async function fetchWithRetry(url: string, throwOnError: boolean): Promise<Response | null> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    // Check if we're rate limited before even making the request
    const waitTime = getWaitTimeUntilReset();
    if (waitTime > 0 && waitTime < 30000) {
      console.info(`[GitHub] Rate limited, waiting ${Math.ceil(waitTime / 1000)}s until reset...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    await throttle();

    try {
      const res = await fetch(url, { headers: HEADERS });
      parseRateLimitHeaders(res);

      // Success
      if (res.ok) return res;

      // Stats endpoints return 202 while computing
      if (res.status === 202) return null;

      // Rate limited (403 or 429)
      if (res.status === 403 || res.status === 429) {
        const retryAfter = res.headers.get("retry-after");
        let backoff: number;

        if (retryAfter) {
          backoff = parseInt(retryAfter, 10) * 1000;
        } else if (rateLimitState.remaining === 0) {
          // Wait until reset
          const nowSec = Math.floor(Date.now() / 1000);
          backoff = Math.max(rateLimitState.resetAt - nowSec, 1) * 1000;
        } else {
          // Exponential backoff: 1s, 2s, 4s
          backoff = BASE_BACKOFF_MS * Math.pow(2, attempt);
        }

        // Cap backoff at 30 seconds for client-side
        backoff = Math.min(backoff, 30000);

        if (attempt < MAX_RETRIES) {
          console.warn(
            `[GitHub] Rate limited (${res.status}), retry ${attempt + 1}/${MAX_RETRIES} in ${Math.ceil(backoff / 1000)}s`
          );
          await new Promise((resolve) => setTimeout(resolve, backoff));
          continue;
        }

        if (throwOnError) {
          throw new Error("GitHub API rate limit exceeded. Try again in a few minutes.");
        }
        return null;
      }

      // 404 — user/resource not found
      if (res.status === 404) {
        if (throwOnError) throw new Error("User not found");
        return null;
      }

      // Other errors
      if (throwOnError) throw new Error(`GitHub API error: ${res.status}`);
      return null;
    } catch (err) {
      if (err instanceof Error && (err.message.includes("rate limit") || err.message === "User not found")) {
        throw err;
      }
      if (attempt < MAX_RETRIES) {
        const backoff = BASE_BACKOFF_MS * Math.pow(2, attempt);
        console.warn(`[GitHub] Request failed, retry ${attempt + 1}/${MAX_RETRIES} in ${backoff}ms`);
        await new Promise((resolve) => setTimeout(resolve, backoff));
        continue;
      }
      if (throwOnError) throw err;
      return null;
    }
  }
  return null;
}

// ─── Public Fetch Helpers ──────────────────────────────────────

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetchWithRetry(url, true);
  if (!res) throw new Error("Failed to fetch from GitHub API");
  return res.json();
}

async function fetchJSONSafe<T>(url: string): Promise<T | null> {
  try {
    const res = await fetchWithRetry(url, false);
    if (!res) return null;
    const data = await res.json();
    if (data === null || data === undefined) return null;
    return data as T;
  } catch {
    return null;
  }
}

// ─── Data Fetchers ─────────────────────────────────────────────

export async function fetchUser(username: string): Promise<GitHubUser> {
  return fetchJSON<GitHubUser>(`${BASE}/users/${username}`);
}

export async function fetchRepos(username: string): Promise<GitHubRepo[]> {
  const repos = await fetchJSON<GitHubRepo[]>(
    `${BASE}/users/${username}/repos?per_page=100&sort=pushed&direction=desc`
  );
  return repos.filter((r) => !r.fork);
}

export async function fetchEvents(username: string): Promise<GitHubEvent[]> {
  const pages = await Promise.all([
    fetchJSON<GitHubEvent[]>(`${BASE}/users/${username}/events/public?per_page=100&page=1`),
    fetchJSON<GitHubEvent[]>(`${BASE}/users/${username}/events/public?per_page=100&page=2`),
    fetchJSON<GitHubEvent[]>(`${BASE}/users/${username}/events/public?per_page=100&page=3`),
  ]);
  return pages.flat();
}

async function fetchRepoDetail(owner: string, repoName: string): Promise<RepoDetail> {
  const [commitActivity, contributors, languages] = await Promise.all([
    fetchJSONSafe<CommitWeek[]>(`${BASE}/repos/${owner}/${repoName}/stats/commit_activity`),
    fetchJSONSafe<ContributorStats[]>(`${BASE}/repos/${owner}/${repoName}/stats/contributors`),
    fetchJSONSafe<LanguageBreakdown>(`${BASE}/repos/${owner}/${repoName}/languages`),
  ]);

  return {
    repoName,
    commitActivity: commitActivity || [],
    contributors: contributors || [],
    languages: languages || {},
  };
}

function selectTopRepos(repos: GitHubRepo[], maxCount: number): GitHubRepo[] {
  const now = Date.now();
  const scored = repos.map((r) => {
    const recencyDays = (now - new Date(r.pushed_at).getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 1 - recencyDays / 365);
    const score = r.stargazers_count * 2 + r.size / 1000 + recencyScore * 10;
    return { repo: r, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxCount).map((s) => s.repo);
}

export async function fetchAllGitHubData(username: string): Promise<GitHubDataset> {
  const [user, rawRepos, rawEvents] = await Promise.all([
    fetchUser(username),
    fetchRepos(username),
    fetchEvents(username),
  ]);

  // Prompt 8: Apply data quality filters
  const repos = filterRepos(rawRepos);
  const events = filterEvents(rawEvents);

  // Limit to top 8 repos for detailed analysis (balance between depth & speed)
  const topRepos = selectTopRepos(repos, 8);

  // Fetch repo details with concurrency limit of 3
  const repoDetails: RepoDetail[] = [];
  const CONCURRENCY = 3;
  for (let i = 0; i < topRepos.length; i += CONCURRENCY) {
    const batch = topRepos.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map((r) => fetchRepoDetail(username, r.name))
    );
    repoDetails.push(...batchResults);
  }

  // Filter bot contributors from repo details
  const cleanedDetails = repoDetails.map(filterRepoDetailContributors);

  return { user, repos, events, repoDetails: cleanedDetails };
}

// ─── Prompt 8: Data Quality Filters ────────────────────────────

const BOT_PATTERNS = [
  /\[bot\]$/i,
  /^dependabot/i,
  /^renovate/i,
  /^greenkeeper/i,
  /^snyk-bot/i,
  /^imgbot/i,
  /^codecov/i,
  /^semantic-release-bot/i,
  /^github-actions/i,
  /^mergify/i,
  /^allcontributors/i,
  /^stale\[bot\]/i,
  /^pull\[bot\]/i,
  /^lgtm-com/i,
  /^depfu/i,
];

const AUTOMATED_COMMIT_PATTERNS = [
  /^merge pull request/i,
  /^merge branch/i,
  /^auto-generated/i,
  /^automated/i,
  /^bump version/i,
  /^update dependencies/i,
  /^chore\(deps\)/i,
  /^\[skip ci\]/i,
  /^initial commit$/i,
];

export function isBot(login: string): boolean {
  return BOT_PATTERNS.some((p) => p.test(login));
}

export function isAutomatedCommitMessage(message: string): boolean {
  return AUTOMATED_COMMIT_PATTERNS.some((p) => p.test(message.trim()));
}

export function isInactiveRepo(repo: GitHubRepo): boolean {
  const now = Date.now();
  const twoYears = 2 * 365 * 24 * 60 * 60 * 1000;
  const lastPush = new Date(repo.pushed_at).getTime();
  const age = now - new Date(repo.created_at).getTime();
  const sixMonths = 6 * 30 * 24 * 60 * 60 * 1000;

  // Inactive = not pushed in 2+ years AND has very few stars AND is older than 6 months
  return (
    now - lastPush > twoYears &&
    repo.stargazers_count < 2 &&
    age > sixMonths &&
    repo.size < 500 // Very small, likely abandoned
  );
}

export function filterRepos(repos: GitHubRepo[]): GitHubRepo[] {
  return repos.filter((r) => {
    // Already filtered forks in fetchRepos, but double-check
    if (r.fork) return false;
    // Filter inactive/abandoned repos
    if (isInactiveRepo(r)) return false;
    return true;
  });
}

export function filterEvents(events: GitHubEvent[]): GitHubEvent[] {
  return events.filter((e) => {
    // Filter bot-generated events
    const actor = (e as any).actor?.login || (e as any).actor?.display_login;
    if (actor && isBot(actor)) return false;

    // Filter automated push events (by commit message if available)
    if (e.type === "PushEvent" && e.payload?.commits) {
      const commits = e.payload.commits as any[];
      if (Array.isArray(commits) && commits.length > 0) {
        const allAutomated = commits.every(
          (c: any) => c.message && isAutomatedCommitMessage(c.message)
        );
        if (allAutomated) return false;
      }
    }

    return true;
  });
}

export function filterRepoDetailContributors(detail: RepoDetail): RepoDetail {
  return {
    ...detail,
    contributors: detail.contributors.filter(
      (c) => c.author?.login && !isBot(c.author.login)
    ),
  };
}

// ─── Exported Rate Limit Info (for UI) ─────────────────────────

export function getRateLimitState(): RateLimitInfo {
  return { ...rateLimitState };
}
