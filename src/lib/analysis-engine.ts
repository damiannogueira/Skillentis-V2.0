import type { GitHubUser, GitHubRepo, GitHubEvent, GitHubDataset, RepoDetail } from "./github-api";

// ─── Codexa Index V1 ───────────────────────────────────────────
// Weights (must sum to 1.0):
//   Consistency:              0.30
//   Project Evolution:        0.20
//   Architecture Complexity:  0.20
//   Collaboration:            0.15
//   Professional Practices:   0.15
// ────────────────────────────────────────────────────────────────

const WEIGHTS = {
  consistency: 0.30,
  architecture: 0.20,
  scope: 0.20,
  collaboration: 0.15,
  practices: 0.15,
} as const;

export interface EvolutionMetrics {
  consistency: number;
  architecture: number;
  scope: number;
  collaboration: number;
  practices: number;
  codexaIndex: number;
}

export interface TimelinePoint {
  year: string;
  consistency: number;
  architecture: number;
  scope: number;
  collaboration: number;
}

export interface Milestone {
  year: string;
  event: string;
  detail: string;
}

export interface AnalysisResult {
  user: GitHubUser;
  metrics: EvolutionMetrics;
  timeline: TimelinePoint[];
  milestones: Milestone[];
  radarData: { metric: string; value: number }[];
  yearsActive: number;
  totalRepos: number;
  topLanguages: string[];
}

function clamp(v: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(v)));
}

function getYearsRange(user: GitHubUser): string[] {
  const startYear = new Date(user.created_at).getFullYear();
  const endYear = new Date().getFullYear();
  const years: string[] = [];
  for (let y = startYear; y <= endYear; y++) years.push(String(y));
  return years;
}

// ─── Signal: Consistency (0.30) ────────────────────────────────
// Uses: commit timestamps, push events, repo maintenance, commit frequency
function computeConsistency(
  repos: GitHubRepo[],
  events: GitHubEvent[],
  repoDetails: RepoDetail[]
): number {
  const now = Date.now();
  const oneYear = 365 * 24 * 60 * 60 * 1000;

  // 1. Recently maintained repos (pushed in last 12 months)
  const recentRepos = repos.filter(
    (r) => now - new Date(r.pushed_at).getTime() < oneYear
  ).length;
  const maintainedRatio = Math.min(recentRepos / Math.max(repos.length, 1), 1);

  // 2. Event spread: unique active days in last 90 days
  const eventDays = new Set(
    events.map((e) => new Date(e.created_at).toISOString().slice(0, 10))
  ).size;
  const daySpread = Math.min(eventDays / 50, 1);

  // 3. Commit frequency from commit_activity (weekly commits over last year)
  const totalWeeklyCommits = repoDetails.reduce((sum, rd) => {
    const activity = Array.isArray(rd.commitActivity) ? rd.commitActivity : [];
    return sum + activity.reduce((s, w) => s + (w.total || 0), 0);
  }, 0);
  // 200+ commits/year = strong signal
  const commitFreqFromActivity = Math.min(totalWeeklyCommits / 200, 1);

  // 4. Commit frequency fallback from push events
  const pushEvents = events.filter((e) => e.type === "PushEvent").length;
  const commitFreqFromEvents = Math.min(pushEvents / 60, 1);

  // Use the better of the two commit frequency signals
  const commitFrequency = Math.max(commitFreqFromActivity, commitFreqFromEvents);

  // 5. Repository longevity: avg age in years (max 5yr = perfect)
  const avgAge = repos.reduce((sum, r) => {
    return sum + (now - new Date(r.created_at).getTime()) / oneYear;
  }, 0) / Math.max(repos.length, 1);
  const longevityScore = Math.min(avgAge / 5, 1);

  // 6. Commit spread across days of week (from commit_activity)
  const dayDistribution = new Array(7).fill(0);
  repoDetails.forEach((rd) => {
    const activity = Array.isArray(rd.commitActivity) ? rd.commitActivity : [];
    activity.forEach((w) => {
      if (Array.isArray(w.days)) {
        w.days.forEach((count, dayIndex) => {
          dayDistribution[dayIndex] += count;
        });
      }
    });
  });
  const activeDaysOfWeek = dayDistribution.filter((d) => d > 0).length;
  const weekSpread = activeDaysOfWeek / 7;

  return clamp(
    maintainedRatio * 20 +
    daySpread * 20 +
    commitFrequency * 25 +
    longevityScore * 15 +
    weekSpread * 20
  );
}

// ─── Signal: Architecture Complexity (0.20) ────────────────────
// Uses: language diversity, per-repo languages, repo size, topics
function computeArchitecture(
  repos: GitHubRepo[],
  repoDetails: RepoDetail[]
): number {
  // 1. Global language diversity (from repo-level languages API)
  const allLanguages = new Set<string>();
  repoDetails.forEach((rd) => {
    Object.keys(rd.languages).forEach((lang) => allLanguages.add(lang));
  });
  // Fallback: also count repo.language
  repos.forEach((r) => { if (r.language) allLanguages.add(r.language); });
  const langScore = Math.min(allLanguages.size / 8, 1);

  // 2. Multi-language repos (repos using 3+ languages)
  const multiLangRepos = repoDetails.filter(
    (rd) => Object.keys(rd.languages).length >= 3
  ).length;
  const multiLangScore = Math.min(multiLangRepos / 3, 1);

  // 3. Large / complex repos (>5MB)
  const largeRepos = repos.filter((r) => r.size > 5000).length;
  const sizeScore = Math.min(largeRepos / 5, 1);

  // 4. Topic/tag usage (signal of organized architecture thinking)
  const withTopics = repos.filter((r) => r.topics && r.topics.length > 0).length;
  const topicScore = Math.min(withTopics / 5, 1);

  // 5. Repo count depth
  const countScore = Math.min(repos.length / 20, 1);

  return clamp(
    langScore * 25 +
    multiLangScore * 20 +
    sizeScore * 20 +
    topicScore * 15 +
    countScore * 20
  );
}

// ─── Signal: Project Evolution / Scope (0.20) ──────────────────
// Uses: total repos, stars, maintained projects, year spread, project age
function computeScope(repos: GitHubRepo[]): number {
  const now = Date.now();
  const oneYear = 365 * 24 * 60 * 60 * 1000;

  // 1. Stars received
  const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);
  const starScore = Math.min(totalStars / 50, 1);

  // 2. Maintained projects (updated in last 2 years)
  const maintained = repos.filter(
    (r) => now - new Date(r.pushed_at).getTime() < 2 * oneYear
  ).length;
  const maintainedScore = Math.min(maintained / 10, 1);

  // 3. Repo count
  const repoScore = Math.min(repos.length / 25, 1);

  // 4. Year spread: repos created across many years
  const repoYears = new Set(repos.map((r) => new Date(r.created_at).getFullYear()));
  const yearSpread = Math.min(repoYears.size / 4, 1);

  // 5. Description quality
  const withDesc = repos.filter((r) => r.description && r.description.length > 10).length;
  const descScore = Math.min(withDesc / Math.max(repos.length, 1), 1);

  return clamp(
    starScore * 20 +
    maintainedScore * 25 +
    repoScore * 20 +
    yearSpread * 20 +
    descScore * 15
  );
}

// ─── Signal: Collaboration (0.15) ──────────────────────────────
// Uses: PR participation, contributors per repo, forks, issues, review events
function computeCollaboration(
  repos: GitHubRepo[],
  events: GitHubEvent[],
  repoDetails: RepoDetail[]
): number {
  // 1. Multi-contributor repos (repos with 2+ contributors)
  const multiContribRepos = repoDetails.filter(
    (rd) => Array.isArray(rd.contributors) && rd.contributors.length >= 2
  ).length;
  const multiContribScore = Math.min(multiContribRepos / 3, 1);

  // 2. Total unique contributors across repos
  const allContributors = new Set<string>();
  repoDetails.forEach((rd) => {
    const contribs = Array.isArray(rd.contributors) ? rd.contributors : [];
    contribs.forEach((c) => {
      if (c.author?.login) allContributors.add(c.author.login);
    });
  });
  const contributorDiversity = Math.min(allContributors.size / 10, 1);

  // 3. Forks received
  const totalForks = repos.reduce((sum, r) => sum + r.forks_count, 0);
  const forkScore = Math.min(totalForks / 20, 1);

  // 4. PR participation (PRs opened, reviewed)
  const prEvents = events.filter(
    (e) => e.type === "PullRequestEvent" || e.type === "PullRequestReviewEvent"
  ).length;
  const prScore = Math.min(prEvents / 20, 1);

  // 5. Issue & comment engagement
  const engagementEvents = events.filter(
    (e) => e.type === "IssueCommentEvent" || e.type === "IssuesEvent" || e.type === "CommitCommentEvent"
  ).length;
  const engagementScore = Math.min(engagementEvents / 15, 1);

  return clamp(
    multiContribScore * 25 +
    contributorDiversity * 20 +
    forkScore * 20 +
    prScore * 20 +
    engagementScore * 15
  );
}

// ─── Signal: Professional Practices (0.15) ─────────────────────
// Uses: documentation, issues enabled, topics, mature patterns, branch naming
function computePractices(repos: GitHubRepo[]): number {
  // 1. Issues enabled ratio
  const withIssues = repos.filter((r) => r.has_issues).length;
  const issueRatio = withIssues / Math.max(repos.length, 1);

  // 2. Descriptions quality (>20 chars)
  const withDesc = repos.filter((r) => r.description && r.description.length > 20).length;
  const descRatio = withDesc / Math.max(repos.length, 1);

  // 3. Topic usage ratio
  const withTopics = repos.filter((r) => r.topics && r.topics.length > 0).length;
  const topicRatio = withTopics / Math.max(repos.length, 1);

  // 4. Mature repos (large size = likely has CI/testing/docs)
  const matureRepos = repos.filter((r) => r.size > 10000).length;
  const matureScore = Math.min(matureRepos / 3, 1);

  // 5. Modern branch naming (main vs master)
  const modernBranch = repos.filter((r) => r.default_branch === "main").length;
  const modernRatio = modernBranch / Math.max(repos.length, 1);

  return clamp(
    issueRatio * 20 +
    descRatio * 20 +
    topicRatio * 20 +
    matureScore * 20 +
    modernRatio * 20
  );
}

// ─── Codexa Index Calculation ──────────────────────────────────
function computeCodexaIndex(metrics: Omit<EvolutionMetrics, "codexaIndex">): number {
  return clamp(
    metrics.consistency * WEIGHTS.consistency +
    metrics.architecture * WEIGHTS.architecture +
    metrics.scope * WEIGHTS.scope +
    metrics.collaboration * WEIGHTS.collaboration +
    metrics.practices * WEIGHTS.practices
  );
}

// ─── Timeline & Milestones (Optimized: cumulative pre-sort) ────

function buildTimeline(
  years: string[],
  repos: GitHubRepo[]
): TimelinePoint[] {
  // Pre-sort repos by creation year once — avoids O(years × repos) filtering
  const reposByYear = new Map<number, GitHubRepo[]>();
  repos.forEach((r) => {
    const y = new Date(r.created_at).getFullYear();
    if (!reposByYear.has(y)) reposByYear.set(y, []);
    reposByYear.get(y)!.push(r);
  });

  // Build cumulative repo list incrementally
  const cumulative: GitHubRepo[] = [];

  return years.map((year, i) => {
    const y = parseInt(year);
    const newRepos = reposByYear.get(y);
    if (newRepos) cumulative.push(...newRepos);

    const progress = Math.min((i + 1) / years.length, 1);

    // Use lightweight versions — no events/repoDetails for timeline
    const consistency = clamp(computeConsistency(cumulative, [], []) * progress * 1.2);
    const architecture = clamp(computeArchitecture(cumulative, []) * progress * 1.1);
    const scope = clamp(computeScope(cumulative) * progress * 1.15);
    const collaboration = clamp(computeCollaboration(cumulative, [], []) * progress * 1.1);

    return { year, consistency, architecture, scope, collaboration };
  });
}

function buildMilestones(
  years: string[],
  repos: GitHubRepo[]
): Milestone[] {
  // Pre-sort repos by creation year
  const reposByYear = new Map<number, number>();
  repos.forEach((r) => {
    const y = new Date(r.created_at).getFullYear();
    reposByYear.set(y, (reposByYear.get(y) || 0) + 1);
  });

  const languagesByYear = new Map<number, Set<string>>();
  repos.forEach((r) => {
    if (!r.language) return;
    const y = new Date(r.created_at).getFullYear();
    if (!languagesByYear.has(y)) languagesByYear.set(y, new Set());
    languagesByYear.get(y)!.add(r.language);
  });

  let totalUpToYear = 0;
  const allLanguages = new Set<string>();

  return years.map((year) => {
    const y = parseInt(year);
    const count = reposByYear.get(y) || 0;
    totalUpToYear += count;

    const yearLangs = languagesByYear.get(y);
    if (yearLangs) yearLangs.forEach((l) => allLanguages.add(l));

    let event: string;
    let detail: string;

    if (totalUpToYear <= 3) {
      event = "First repositories";
      detail = `${totalUpToYear} repos, early experiments`;
    } else if (totalUpToYear <= 8) {
      event = "Growing portfolio";
      detail = `${totalUpToYear} repos, ${allLanguages.size} languages`;
    } else if (totalUpToYear <= 15) {
      event = "Multi-project development";
      detail = `${totalUpToYear} active repos, expanding scope`;
    } else if (totalUpToYear <= 25) {
      event = "Established developer";
      detail = `${totalUpToYear} repos across ${allLanguages.size} languages`;
    } else if (totalUpToYear <= 40) {
      event = "Production-level practices";
      detail = `${totalUpToYear} repos, mature workflow`;
    } else {
      event = "System-level expertise";
      detail = `${totalUpToYear}+ repos, complex architectures`;
    }

    if (count === 0 && totalUpToYear > 0) {
      event = "Maintenance & consolidation";
      detail = `Maintaining ${totalUpToYear} repositories`;
    }

    return { year, event, detail };
  });
}

// ─── Main Analysis Entry ───────────────────────────────────────

export function analyzeGitHubData(dataset: GitHubDataset): AnalysisResult {
  const { user, repos, events, repoDetails } = dataset;
  const years = getYearsRange(user);

  const consistency = computeConsistency(repos, events, repoDetails);
  const architecture = computeArchitecture(repos, repoDetails);
  const scope = computeScope(repos);
  const collaboration = computeCollaboration(repos, events, repoDetails);
  const practices = computePractices(repos);

  const codexaIndex = computeCodexaIndex({
    consistency, architecture, scope, collaboration, practices,
  });

  // Aggregate all languages from detailed breakdown
  const langBytes: Record<string, number> = {};
  repoDetails.forEach((rd) => {
    Object.entries(rd.languages).forEach(([lang, bytes]) => {
      langBytes[lang] = (langBytes[lang] || 0) + bytes;
    });
  });
  // Fallback: include repo.language
  repos.forEach((r) => {
    if (r.language && !langBytes[r.language]) {
      langBytes[r.language] = 1;
    }
  });
  const topLanguages = Object.entries(langBytes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([lang]) => lang);

  return {
    user,
    metrics: { consistency, architecture, scope, collaboration, practices, codexaIndex },
    timeline: buildTimeline(years, repos),
    milestones: buildMilestones(years, repos),
    radarData: [
      { metric: "Consistency", value: consistency },
      { metric: "Architecture", value: architecture },
      { metric: "Scope", value: scope },
      { metric: "Collaboration", value: collaboration },
      { metric: "Practices", value: practices },
    ],
    yearsActive: years.length,
    totalRepos: repos.length,
    topLanguages,
  };
}
