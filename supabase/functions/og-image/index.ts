import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GITHUB_API = "https://api.github.com";

async function fetchGitHubUser(username: string) {
  const res = await fetch(`${GITHUB_API}/users/${username}`, {
    headers: { Accept: "application/vnd.github.v3+json" },
  });
  if (!res.ok) return null;
  return await res.json();
}

async function fetchGitHubRepos(username: string) {
  const res = await fetch(
    `${GITHUB_API}/users/${username}/repos?per_page=100&sort=pushed`,
    { headers: { Accept: "application/vnd.github.v3+json" } }
  );
  if (!res.ok) return [];
  const repos = await res.json();
  return repos.filter((r: any) => !r.fork);
}

function computeMetrics(repos: any[]) {
  const languages = new Set(repos.map((r: any) => r.language).filter(Boolean));
  const totalStars = repos.reduce((s: number, r: any) => s + r.stargazers_count, 0);
  const totalForks = repos.reduce((s: number, r: any) => s + r.forks_count, 0);

  const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

  const now = Date.now();
  const recentRepos = repos.filter(
    (r: any) => now - new Date(r.pushed_at).getTime() < 365 * 24 * 60 * 60 * 1000
  ).length;
  const consistency = clamp((recentRepos / Math.max(repos.length, 1)) * 60);
  const architecture = clamp((Math.min(languages.size / 6, 1) * 30) + (Math.min(repos.filter((r: any) => r.size > 5000).length / 5, 1) * 25) + (Math.min(repos.length / 20, 1) * 25));
  const scope = clamp((Math.min(totalStars / 50, 1) * 25) + (Math.min(repos.length / 25, 1) * 25) + (Math.min(repos.filter((r: any) => r.description?.length > 10).length / Math.max(repos.length, 1), 1) * 25));
  const collaboration = clamp((Math.min(totalForks / 20, 1) * 50) + (Math.min(repos.reduce((s: number, r: any) => s + r.open_issues_count, 0) / 30, 1) * 50));
  const practices = clamp((repos.filter((r: any) => r.has_issues).length / Math.max(repos.length, 1)) * 50 + (repos.filter((r: any) => r.size > 10000).length / 3) * 50);

  const codexaIndex = clamp(consistency * 0.30 + architecture * 0.20 + scope * 0.20 + collaboration * 0.15 + practices * 0.15);

  return { consistency, architecture, scope, collaboration, practices, codexaIndex };
}

function generateOGImage(user: any, metrics: any, yearsActive: number, repoCount: number) {
  // Generate an SVG-based OG image
  const name = user.name || user.login;
  const avatarUrl = user.avatar_url;

  return `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0c10"/>
      <stop offset="100%" style="stop-color:#111318"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#22c55e"/>
      <stop offset="100%" style="stop-color:#06b6d4"/>
    </linearGradient>
    <clipPath id="avatarClip"><circle cx="100" cy="180" r="50"/></clipPath>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  
  <!-- Border glow -->
  <rect x="40" y="40" width="1120" height="550" rx="24" fill="none" stroke="#22c55e" stroke-opacity="0.15" stroke-width="1"/>
  
  <!-- Avatar -->
  <image href="${avatarUrl}" x="80" y="130" width="100" height="100" clip-path="url(#avatarClip)" preserveAspectRatio="xMidYMid slice"/>
  <circle cx="130" cy="180" r="50" fill="none" stroke="#1e293b" stroke-width="2"/>

  <!-- Name & info -->
  <text x="200" y="170" font-family="system-ui, sans-serif" font-size="36" font-weight="700" fill="#e2e8f0">${escapeXml(name)}</text>
  <text x="200" y="205" font-family="system-ui, sans-serif" font-size="18" fill="#64748b">@${escapeXml(user.login)} · ${repoCount} repos · ${yearsActive} years on GitHub</text>

  <!-- Codexa Index -->
  <rect x="850" y="100" width="250" height="140" rx="16" fill="#111318" stroke="#22c55e" stroke-opacity="0.2"/>
  <text x="975" y="150" font-family="system-ui, sans-serif" font-size="14" fill="#64748b" text-anchor="middle">Codexa Index</text>
  <text x="975" y="210" font-family="system-ui, sans-serif" font-size="64" font-weight="700" fill="url(#accent)" text-anchor="middle">${metrics.codexaIndex}</text>

  <!-- Metrics bars -->
  ${renderMetricBar("Consistency", metrics.consistency, 80, 300)}
  ${renderMetricBar("Architecture", metrics.architecture, 80, 360)}
  ${renderMetricBar("Project Scope", metrics.scope, 80, 420)}
  ${renderMetricBar("Collaboration", metrics.collaboration, 80, 480)}

  <!-- Branding -->
  <text x="80" y="80" font-family="system-ui, sans-serif" font-size="28" font-weight="700" fill="#e2e8f0">Skill<tspan fill="#22c55e">entis</tspan></text>
  <text x="80" y="570" font-family="system-ui, sans-serif" font-size="14" fill="#475569">Developer Evolution Profile · skillentis.app</text>
</svg>`;
}

function renderMetricBar(label: string, value: number, x: number, y: number) {
  const barWidth = 700;
  const fillWidth = (value / 100) * barWidth;
  return `
    <text x="${x}" y="${y}" font-family="system-ui, sans-serif" font-size="16" fill="#94a3b8">${escapeXml(label)}</text>
    <text x="${x + barWidth + 20}" y="${y}" font-family="system-ui, sans-serif" font-size="18" font-weight="700" fill="#e2e8f0">${value}</text>
    <rect x="${x}" y="${y + 8}" width="${barWidth}" height="8" rx="4" fill="#1e293b"/>
    <rect x="${x}" y="${y + 8}" width="${fillWidth}" height="8" rx="4" fill="url(#accent)"/>
  `;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const username = url.searchParams.get("username");
    const format = url.searchParams.get("format") || "html"; // html, svg, json

    if (!username) {
      return new Response(JSON.stringify({ error: "username parameter required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [user, repos] = await Promise.all([
      fetchGitHubUser(username),
      fetchGitHubRepos(username),
    ]);

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const startYear = new Date(user.created_at).getFullYear();
    const yearsActive = new Date().getFullYear() - startYear + 1;
    const metrics = computeMetrics(repos);

    if (format === "svg") {
      const svg = generateOGImage(user, metrics, yearsActive, repos.length);
      return new Response(svg, {
        headers: {
          ...corsHeaders,
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
      });
    }

    if (format === "json") {
      return new Response(JSON.stringify({ user: { login: user.login, name: user.name, avatar_url: user.avatar_url, bio: user.bio }, metrics, yearsActive, repoCount: repos.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" },
      });
    }

    // Default: return full HTML page with OG tags (for crawlers)
    const name = user.name || user.login;
    const description = `${name}'s developer evolution: Codexa Index ${metrics.codexaIndex}. ${yearsActive} years of GitHub growth. Consistency ${metrics.consistency}, Architecture ${metrics.architecture}.`;
    const profileUrl = `https://skillentis.app/profile/${username}`;
    const ogImageUrl = `${url.origin}/functions/v1/og-image?username=${username}&format=svg`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${escapeXml(name)} — Developer Evolution Profile | Skillentis</title>
  <meta name="description" content="${escapeXml(description)}"/>
  <meta property="og:title" content="${escapeXml(name)} — Developer Evolution Profile | Skillentis"/>
  <meta property="og:description" content="${escapeXml(description)}"/>
  <meta property="og:image" content="${ogImageUrl}"/>
  <meta property="og:image:width" content="1200"/>
  <meta property="og:image:height" content="630"/>
  <meta property="og:url" content="${profileUrl}"/>
  <meta property="og:type" content="profile"/>
  <meta property="og:site_name" content="Skillentis"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${escapeXml(name)} — Developer Evolution | Skillentis"/>
  <meta name="twitter:description" content="${escapeXml(description)}"/>
  <meta name="twitter:image" content="${ogImageUrl}"/>
  <script>window.location.replace("/profile/${encodeURIComponent(username)}");</script>
</head>
<body>
  <h1>${escapeXml(name)} — Developer Evolution Profile</h1>
  <p>${escapeXml(description)}</p>
  <p>Redirecting to <a href="/profile/${encodeURIComponent(username)}">Skillentis profile</a>...</p>
</body>
</html>`;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
