import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GITHUB_API = "https://api.github.com";

// ─── Rate Limit State (server-side) ───────────────────────────

let serverRateLimit = { remaining: 60, resetAt: 0 };
let lastRequestTime = 0;
const MIN_GAP_MS = 80;
const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 1000;

function parseRateHeaders(res: Response) {
  const r = res.headers.get("x-ratelimit-remaining");
  const t = res.headers.get("x-ratelimit-reset");
  if (r !== null) serverRateLimit.remaining = parseInt(r, 10);
  if (t !== null) serverRateLimit.resetAt = parseInt(t, 10);
}

async function throttle() {
  const now = Date.now();
  const gap = now - lastRequestTime;
  if (gap < MIN_GAP_MS) {
    await new Promise((r) => setTimeout(r, MIN_GAP_MS - gap));
  }
  lastRequestTime = Date.now();
}

async function waitForReset() {
  if (serverRateLimit.remaining > 0) return;
  const nowSec = Math.floor(Date.now() / 1000);
  const waitMs = Math.max(serverRateLimit.resetAt - nowSec, 1) * 1000;
  if (waitMs > 0 && waitMs < 45000) {
    await new Promise((r) => setTimeout(r, waitMs));
  }
}

// ─── Fetch with Retry + Backoff ───────────────────────────────

const GH_HEADERS: Record<string, string> = { Accept: "application/vnd.github.v3+json" };

// Use GITHUB_TOKEN if available (optional secret)
const ghToken = typeof Deno !== "undefined" ? Deno.env.get("GITHUB_TOKEN") : null;
if (ghToken) {
  GH_HEADERS["Authorization"] = `Bearer ${ghToken}`;
}

async function fetchWithRetry(url: string): Promise<Response | null> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    await waitForReset();
    await throttle();

    try {
      const res = await fetch(url, { headers: GH_HEADERS });
      parseRateHeaders(res);

      if (res.ok) return res;
      if (res.status === 202) return null; // stats computing

      if (res.status === 403 || res.status === 429) {
        const retryAfter = res.headers.get("retry-after");
        let backoff: number;
        if (retryAfter) {
          backoff = parseInt(retryAfter, 10) * 1000;
        } else if (serverRateLimit.remaining === 0) {
          const nowSec = Math.floor(Date.now() / 1000);
          backoff = Math.max(serverRateLimit.resetAt - nowSec, 1) * 1000;
        } else {
          backoff = BASE_BACKOFF_MS * Math.pow(2, attempt);
        }
        backoff = Math.min(backoff, 45000);

        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, backoff));
          continue;
        }
        return null;
      }

      if (res.status === 404) return null;
      return null;
    } catch {
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, BASE_BACKOFF_MS * Math.pow(2, attempt)));
        continue;
      }
      return null;
    }
  }
  return null;
}

async function fetchJSON(url: string) {
  const res = await fetchWithRetry(url);
  if (!res) return null;
  return await res.json();
}

// ─── Prompt 8: Data Quality Filters ────────────────────────────

const BOT_PATTERNS = [
  /\[bot\]$/i, /^dependabot/i, /^renovate/i, /^greenkeeper/i, /^snyk-bot/i,
  /^imgbot/i, /^codecov/i, /^semantic-release-bot/i, /^github-actions/i,
  /^mergify/i, /^allcontributors/i, /^stale\[bot\]/i, /^pull\[bot\]/i, /^depfu/i,
];

const AUTOMATED_COMMIT_PATTERNS = [
  /^merge pull request/i, /^merge branch/i, /^auto-generated/i, /^automated/i,
  /^bump version/i, /^update dependencies/i, /^chore\(deps\)/i, /^\[skip ci\]/i,
  /^initial commit$/i,
];

function isBot(login: string): boolean {
  return BOT_PATTERNS.some((p) => p.test(login));
}

function isInactiveRepo(r: any): boolean {
  const now = Date.now();
  const twoYears = 2 * 365 * 24 * 60 * 60 * 1000;
  const sixMonths = 6 * 30 * 24 * 60 * 60 * 1000;
  const lastPush = new Date(r.pushed_at).getTime();
  const age = now - new Date(r.created_at).getTime();
  return now - lastPush > twoYears && r.stargazers_count < 2 && age > sixMonths && r.size < 500;
}

function filterRepos(repos: any[]): any[] {
  return repos.filter((r: any) => !r.fork && !isInactiveRepo(r));
}

function filterEvents(events: any[]): any[] {
  return events.filter((e: any) => {
    const actor = e.actor?.login || e.actor?.display_login;
    if (actor && isBot(actor)) return false;
    if (e.type === "PushEvent" && e.payload?.commits) {
      const commits = Array.isArray(e.payload.commits) ? e.payload.commits : [];
      if (commits.length > 0 && commits.every((c: any) =>
        c.message && AUTOMATED_COMMIT_PATTERNS.some((p) => p.test(c.message.trim()))
      )) return false;
    }
    return true;
  });
}

function filterContributors(contributors: any[]): any[] {
  return (Array.isArray(contributors) ? contributors : []).filter(
    (c: any) => c.author?.login && !isBot(c.author.login)
  );
}

// ─── Analysis Functions ────────────────────────────────────────

function clamp(v: number) {
  return Math.max(0, Math.min(100, Math.round(v)));
}

function computeConsistency(repos: any[], events: any[], repoDetails: any[]) {
  const now = Date.now();
  const oneYear = 365 * 24 * 60 * 60 * 1000;

  const recentRepos = repos.filter(
    (r: any) => now - new Date(r.pushed_at).getTime() < oneYear
  ).length;
  const maintainedRatio = Math.min(recentRepos / Math.max(repos.length, 1), 1);

  const eventDays = new Set(
    events.map((e: any) => new Date(e.created_at).toISOString().slice(0, 10))
  ).size;
  const daySpread = Math.min(eventDays / 50, 1);

  const totalWeeklyCommits = repoDetails.reduce((sum: number, rd: any) => {
    const activity = Array.isArray(rd.commitActivity) ? rd.commitActivity : [];
    return sum + activity.reduce((s: number, w: any) => s + (w.total || 0), 0);
  }, 0);
  const commitFreqFromActivity = Math.min(totalWeeklyCommits / 200, 1);

  const pushEvents = events.filter((e: any) => e.type === "PushEvent").length;
  const commitFreqFromEvents = Math.min(pushEvents / 60, 1);
  const commitFrequency = Math.max(commitFreqFromActivity, commitFreqFromEvents);

  const avgAge = repos.reduce((sum: number, r: any) => {
    return sum + (now - new Date(r.created_at).getTime()) / oneYear;
  }, 0) / Math.max(repos.length, 1);
  const longevityScore = Math.min(avgAge / 5, 1);

  const dayDistribution = new Array(7).fill(0);
  repoDetails.forEach((rd: any) => {
    const activity = Array.isArray(rd.commitActivity) ? rd.commitActivity : [];
    activity.forEach((w: any) => {
      if (Array.isArray(w.days)) {
        w.days.forEach((count: number, dayIndex: number) => {
          dayDistribution[dayIndex] += count;
        });
      }
    });
  });
  const activeDaysOfWeek = dayDistribution.filter((d: number) => d > 0).length;
  const weekSpread = activeDaysOfWeek / 7;

  return clamp(
    maintainedRatio * 20 + daySpread * 20 + commitFrequency * 25 + longevityScore * 15 + weekSpread * 20
  );
}

function computeArchitecture(repos: any[], repoDetails: any[]) {
  const allLanguages = new Set<string>();
  repoDetails.forEach((rd: any) => {
    if (rd.languages && typeof rd.languages === "object") {
      Object.keys(rd.languages).forEach((lang) => allLanguages.add(lang));
    }
  });
  repos.forEach((r: any) => { if (r.language) allLanguages.add(r.language); });
  const langScore = Math.min(allLanguages.size / 8, 1);

  const multiLangRepos = repoDetails.filter(
    (rd: any) => rd.languages && Object.keys(rd.languages).length >= 3
  ).length;
  const multiLangScore = Math.min(multiLangRepos / 3, 1);

  const largeRepos = repos.filter((r: any) => r.size > 5000).length;
  const sizeScore = Math.min(largeRepos / 5, 1);

  const withTopics = repos.filter((r: any) => r.topics?.length > 0).length;
  const topicScore = Math.min(withTopics / 5, 1);

  const countScore = Math.min(repos.length / 20, 1);

  return clamp(langScore * 25 + multiLangScore * 20 + sizeScore * 20 + topicScore * 15 + countScore * 20);
}

function computeScope(repos: any[]) {
  const now = Date.now();
  const oneYear = 365 * 24 * 60 * 60 * 1000;
  const totalStars = repos.reduce((s: number, r: any) => s + r.stargazers_count, 0);
  const starScore = Math.min(totalStars / 50, 1);
  const maintained = repos.filter((r: any) => now - new Date(r.pushed_at).getTime() < 2 * oneYear).length;
  const maintainedScore = Math.min(maintained / 10, 1);
  const repoScore = Math.min(repos.length / 25, 1);
  const repoYears = new Set(repos.map((r: any) => new Date(r.created_at).getFullYear()));
  const yearSpread = Math.min(repoYears.size / 4, 1);
  const withDesc = repos.filter((r: any) => r.description?.length > 10).length;
  const descScore = Math.min(withDesc / Math.max(repos.length, 1), 1);
  return clamp(starScore * 20 + maintainedScore * 25 + repoScore * 20 + yearSpread * 20 + descScore * 15);
}

function computeCollaboration(repos: any[], events: any[], repoDetails: any[]) {
  const multiContribRepos = repoDetails.filter(
    (rd: any) => Array.isArray(rd.contributors) && rd.contributors.length >= 2
  ).length;
  const multiContribScore = Math.min(multiContribRepos / 3, 1);

  const allContributors = new Set<string>();
  repoDetails.forEach((rd: any) => {
    const contribs = Array.isArray(rd.contributors) ? rd.contributors : [];
    contribs.forEach((c: any) => { if (c.author?.login) allContributors.add(c.author.login); });
  });
  const contributorDiversity = Math.min(allContributors.size / 10, 1);

  const totalForks = repos.reduce((s: number, r: any) => s + r.forks_count, 0);
  const forkScore = Math.min(totalForks / 20, 1);

  const prEvents = events.filter(
    (e: any) => e.type === "PullRequestEvent" || e.type === "PullRequestReviewEvent"
  ).length;
  const prScore = Math.min(prEvents / 20, 1);

  const engagementEvents = events.filter(
    (e: any) => e.type === "IssueCommentEvent" || e.type === "IssuesEvent"
  ).length;
  const engagementScore = Math.min(engagementEvents / 15, 1);

  return clamp(multiContribScore * 25 + contributorDiversity * 20 + forkScore * 20 + prScore * 20 + engagementScore * 15);
}

function computePractices(repos: any[]) {
  const withIssues = repos.filter((r: any) => r.has_issues).length;
  const issueRatio = withIssues / Math.max(repos.length, 1);
  const withDesc = repos.filter((r: any) => r.description?.length > 20).length;
  const descRatio = withDesc / Math.max(repos.length, 1);
  const withTopics = repos.filter((r: any) => r.topics?.length > 0).length;
  const topicRatio = withTopics / Math.max(repos.length, 1);
  const matureRepos = repos.filter((r: any) => r.size > 10000).length;
  const matureScore = Math.min(matureRepos / 3, 1);
  const modernBranch = repos.filter((r: any) => r.default_branch === "main").length;
  const modernRatio = modernBranch / Math.max(repos.length, 1);
  return clamp(issueRatio * 20 + descRatio * 20 + topicRatio * 20 + matureScore * 20 + modernRatio * 20);
}

// ─── Pipeline ──────────────────────────────────────────────────

async function runPipeline(jobId: string, username: string, supabase: any) {
  const updateJob = async (fields: Record<string, any>) => {
    await supabase.from("analysis_jobs").update(fields).eq("id", jobId);
  };

  try {
    await updateJob({ status: "running", progress: 10, message: "Fetching GitHub user profile..." });

    // Explicit status check to differentiate 404 (not found) vs 403/429 (rate limit)
    await throttle();
    const userRes = await fetch(`${GITHUB_API}/users/${username}`, { headers: GH_HEADERS });
    parseRateHeaders(userRes);
    if (userRes.status === 404) {
      await updateJob({ status: "error", error_message: `GitHub user @${username} not found`, progress: 0 });
      return;
    }
    if (userRes.status === 403 || userRes.status === 429) {
      await updateJob({ status: "error", error_message: "GitHub rate limit reached. Try again in a few minutes.", progress: 0 });
      return;
    }
    if (!userRes.ok) {
      await updateJob({ status: "error", error_message: `GitHub API error (${userRes.status})`, progress: 0 });
      return;
    }
    const user = await userRes.json();

    await updateJob({ progress: 20, message: "Fetching repositories..." });
    const reposRaw = await fetchJSON(`${GITHUB_API}/users/${username}/repos?per_page=100&sort=pushed&direction=desc`);
    const repos = filterRepos(reposRaw || []);

    await updateJob({ progress: 30, message: "Filtering noise & bots..." });

    const [events1, events2, events3] = await Promise.all([
      fetchJSON(`${GITHUB_API}/users/${username}/events/public?per_page=100&page=1`),
      fetchJSON(`${GITHUB_API}/users/${username}/events/public?per_page=100&page=2`),
      fetchJSON(`${GITHUB_API}/users/${username}/events/public?per_page=100&page=3`),
    ]);
    const events = filterEvents([...(events1 || []), ...(events2 || []), ...(events3 || [])]);

    await updateJob({ status: "partial", progress: 50, message: "Analyzing top repositories..." });

    const now = Date.now();
    const scored = repos.map((r: any) => {
      const recencyDays = (now - new Date(r.pushed_at).getTime()) / (1000 * 60 * 60 * 24);
      const recencyScore = Math.max(0, 1 - recencyDays / 365);
      const score = r.stargazers_count * 2 + r.size / 1000 + recencyScore * 10;
      return { repo: r, score };
    });
    scored.sort((a: any, b: any) => b.score - a.score);
    const topRepos = scored.slice(0, 5).map((s: any) => s.repo);

    // Fetch repo details sequentially to respect rate limits
    const repoDetails = [];
    for (const r of topRepos) {
      const [commitActivity, contributors, languages] = await Promise.all([
        fetchJSON(`${GITHUB_API}/repos/${username}/${r.name}/stats/commit_activity`),
        fetchJSON(`${GITHUB_API}/repos/${username}/${r.name}/stats/contributors`),
        fetchJSON(`${GITHUB_API}/repos/${username}/${r.name}/languages`),
      ]);
      repoDetails.push({
        repoName: r.name,
        commitActivity: commitActivity || [],
        contributors: filterContributors(contributors || []),
        languages: languages || {},
      });
    }

    await updateJob({ progress: 75, message: "Computing evolution signals..." });

    const consistency = computeConsistency(repos, events, repoDetails);
    const architecture = computeArchitecture(repos, repoDetails);
    const scope = computeScope(repos);
    const collaboration = computeCollaboration(repos, events, repoDetails);
    const practices = computePractices(repos);
    const codexaIndex = clamp(
      consistency * 0.30 + architecture * 0.20 + scope * 0.20 + collaboration * 0.15 + practices * 0.15
    );

    const startYear = new Date(user.created_at).getFullYear();
    const endYear = new Date().getFullYear();
    const years: string[] = [];
    for (let y = startYear; y <= endYear; y++) years.push(String(y));

    const timeline = years.map((year: string, i: number) => {
      const y = parseInt(year);
      const reposUpToYear = repos.filter((r: any) => new Date(r.created_at).getFullYear() <= y);
      const progress = Math.min((i + 1) / years.length, 1);
      return {
        year,
        consistency: clamp(computeConsistency(reposUpToYear, [], []) * progress * 1.2),
        architecture: clamp(computeArchitecture(reposUpToYear, []) * progress * 1.1),
        scope: clamp(computeScope(reposUpToYear) * progress * 1.15),
        collaboration: clamp(computeCollaboration(reposUpToYear, [], []) * progress * 1.1),
      };
    });

    const milestones = years.map((year: string) => {
      const y = parseInt(year);
      const reposThisYear = repos.filter((r: any) => new Date(r.created_at).getFullYear() === y);
      const totalUpToYear = repos.filter((r: any) => new Date(r.created_at).getFullYear() <= y).length;
      const languages = new Set(
        repos.filter((r: any) => new Date(r.created_at).getFullYear() <= y && r.language).map((r: any) => r.language)
      );
      const count = reposThisYear.length;
      let event: string, detail: string;
      if (totalUpToYear <= 3) { event = "First repositories"; detail = `${totalUpToYear} repos, early experiments`; }
      else if (totalUpToYear <= 8) { event = "Growing portfolio"; detail = `${totalUpToYear} repos, ${languages.size} languages`; }
      else if (totalUpToYear <= 15) { event = "Multi-project development"; detail = `${totalUpToYear} active repos, expanding scope`; }
      else if (totalUpToYear <= 25) { event = "Established developer"; detail = `${totalUpToYear} repos across ${languages.size} languages`; }
      else if (totalUpToYear <= 40) { event = "Production-level practices"; detail = `${totalUpToYear} repos, mature workflow`; }
      else { event = "System-level expertise"; detail = `${totalUpToYear}+ repos, complex architectures`; }
      if (count === 0 && totalUpToYear > 0) { event = "Maintenance & consolidation"; detail = `Maintaining ${totalUpToYear} repositories`; }
      return { year, event, detail };
    });

    const langBytes: Record<string, number> = {};
    repoDetails.forEach((rd: any) => {
      if (rd.languages && typeof rd.languages === "object") {
        Object.entries(rd.languages).forEach(([lang, bytes]) => {
          langBytes[lang] = (langBytes[lang] || 0) + (bytes as number);
        });
      }
    });
    repos.forEach((r: any) => { if (r.language && !langBytes[r.language]) langBytes[r.language] = 1; });
    const topLanguages = Object.entries(langBytes).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([lang]) => lang);

    await updateJob({ progress: 90, message: "Finalizing profile..." });

    const result = {
      user: {
        login: user.login,
        name: user.name,
        avatar_url: user.avatar_url,
        bio: user.bio,
        public_repos: user.public_repos,
        followers: user.followers,
        following: user.following,
        created_at: user.created_at,
      },
      metrics: { consistency, architecture, scope, collaboration, practices, codexaIndex },
      timeline,
      milestones,
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

    await updateJob({
      status: "complete",
      progress: 100,
      message: "Analysis complete",
      result,
      completed_at: new Date().toISOString(),
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    await updateJob({ status: "error", error_message: msg, progress: 0 });
  }
}

// ─── Edge Function Handler ─────────────────────────────────────

const DEMO_USERNAMES = new Set(["torvalds"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const username: string | undefined = body?.username;
    const jobId: string | undefined = body?.jobId;

    if (!username || typeof username !== "string" || username.length > 100) {
      return new Response(JSON.stringify({ error: "Invalid username" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isDemo = DEMO_USERNAMES.has(username.trim().toLowerCase());

    // Auth: required for all non-demo requests
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const authClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const token = authHeader.replace("Bearer ", "");
      const { data, error } = await authClient.auth.getClaims(token);
      if (!error && data?.claims?.sub) {
        userId = data.claims.sub as string;
      }
    }

    if (!userId && !isDemo) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Server-side quota enforcement for free users (skip demo profiles)
    if (userId && !isDemo) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      const isPro = (roles || []).some(
        (r: any) => r.role === "pro" || r.role === "pro_recruiter"
      );
      if (!isPro) {
        const { count } = await supabase
          .from("analysis_usage")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("month", new Date().toISOString().slice(0, 7));
        if ((count || 0) >= 1) {
          return new Response(
            JSON.stringify({ error: "Monthly quota exceeded. Upgrade to Pro for unlimited analyses." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    if (jobId) {
      // Verify caller owns this job (or it's a demo job with no owner)
      const { data: existing } = await supabase
        .from("analysis_jobs")
        .select("user_id, username")
        .eq("id", jobId)
        .single();
      if (!existing) {
        return new Response(JSON.stringify({ error: "Job not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const ownerOk = existing.user_id === userId;
      const demoOk = existing.user_id === null && DEMO_USERNAMES.has((existing.username || "").toLowerCase());
      if (!ownerOk && !demoOk) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const pipelinePromise = runPipeline(jobId, username, supabase);
      if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
        EdgeRuntime.waitUntil(pipelinePromise);
      } else {
        await pipelinePromise;
      }
      return new Response(JSON.stringify({ ok: true, jobId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: job, error: insertError } = await supabase
      .from("analysis_jobs")
      .insert({ username, status: "queued", user_id: userId })
      .select("id")
      .single();

    if (insertError || !job) {
      return new Response(JSON.stringify({ error: "Failed to create job" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pipelinePromise = runPipeline(job.id, username, supabase);
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(pipelinePromise);
    } else {
      await pipelinePromise;
    }

    return new Response(JSON.stringify({ ok: true, jobId: job.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
