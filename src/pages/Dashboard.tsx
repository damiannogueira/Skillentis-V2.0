import { useRef, useCallback, useMemo, lazy, Suspense, useState, useEffect } from "react";
import ShareableEvolutionCard from "@/components/ShareableEvolutionCard";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  ArrowLeft, TrendingUp, GitBranch, Users, Clock, Download,
  Loader2, AlertCircle, Copy, Linkedin, Code2, Twitter, MessageCircle,
  FileText, Share2, ChevronDown, ChevronUp, Eye,
} from "lucide-react";
import html2canvas from "html2canvas";
import { useGitHubAnalysis } from "@/hooks/use-github-analysis";
import { getOGImageUrl } from "@/lib/og-utils";
import { useToast } from "@/hooks/use-toast";
import OfflineBanner from "@/components/OfflineBanner";
import { useAuth } from "@/hooks/use-auth";
import { useAccessControl, recordAnalysisUsage, isDemoAnalysis } from "@/hooks/use-access-control";
import UpgradeModal from "@/components/UpgradeModal";
import { useTranslation } from "react-i18next";

// Lazy load heavy chart library
const LazyCharts = lazy(() => import("@/components/DashboardCharts"));

// Collapsible timeline for long histories (>10 years)
interface TimelineSectionProps {
  milestones: { year: string; event: string; detail: string }[];
}

const MAX_VISIBLE_MILESTONES = 8;

const TimelineSection = ({ milestones }: TimelineSectionProps) => {
  const [expanded, setExpanded] = useState(false);
  const { t, i18n } = useTranslation();
  const isLong = milestones.length > MAX_VISIBLE_MILESTONES;
  const visible = expanded || !isLong ? milestones : milestones.slice(-MAX_VISIBLE_MILESTONES);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="p-6 rounded-xl bg-card border border-border mb-8"
    >
      <h3 className="font-display font-semibold mb-6">{t("dashboard.timelineTitle")}</h3>
      {isLong && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mb-4 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <ChevronUp className="w-3 h-3" /> {t("dashboard.showEarlier", { count: milestones.length - MAX_VISIBLE_MILESTONES })}
        </button>
      )}
      <div className="space-y-0">
        {visible.map((m, i) => (
          <div key={m.year} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-primary shrink-0" />
              {i < visible.length - 1 && <div className="w-px flex-1 bg-border" />}
            </div>
            <div className="pb-6">
              <p className="font-display text-sm font-semibold">{m.year} — {m.event}</p>
              <p className="text-xs text-muted-foreground">{m.detail}</p>
            </div>
          </div>
        ))}
      </div>
      {isLong && expanded && (
        <button
          onClick={() => setExpanded(false)}
          className="mt-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <ChevronDown className="w-3 h-3" /> {t("dashboard.collapseTimeline")}
        </button>
      )}
    </motion.div>
  );
};

const Dashboard = () => {
  const { username } = useParams();
  const { result, loading, error, jobState, cachedAt } = useGitHubAnalysis(username);
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user: authUser, githubUsername, publicProfile, loading: authLoading } = useAuth();
  const { canAnalyze } = useAccessControl();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [usageRecorded, setUsageRecorded] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !authUser) {
      navigate("/auth");
    }
  }, [authLoading, authUser, navigate]);

  // Record usage when analysis completes (skip demo profiles like @torvalds)
  useEffect(() => {
    if (result && authUser && username && !usageRecorded && !isDemoAnalysis(username)) {
      recordAnalysisUsage(authUser.id, username);
      setUsageRecorded(true);
    }
  }, [result, authUser, username, usageRecorded]);

  const profileUrl = `${window.location.origin}/profile/${username}`;
  const dashboardUrl = `${window.location.origin}/dashboard/${username}`;

  const handleCopyLink = useCallback(async () => {
    await navigator.clipboard.writeText(profileUrl);
    toast({ title: t("dashboard.linkCopied"), description: t("dashboard.linkCopiedDesc") });
  }, [profileUrl, toast, t]);

  const handleShareLinkedIn = useCallback(() => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`, "_blank");
  }, [profileUrl]);

  const handleShareTwitter = useCallback(() => {
    const text = encodeURIComponent(`I analyzed my GitHub evolution using @Skillentis 🚀`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(profileUrl)}`, "_blank");
  }, [profileUrl]);

  const handleShareWhatsApp = useCallback(() => {
    const text = encodeURIComponent(`Check out my developer evolution profile: ${profileUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }, [profileUrl]);

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      await navigator.share({ title: `${username} — Skillentis`, url: profileUrl });
    }
  }, [username, profileUrl]);

  const handleDownloadPNG = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, { backgroundColor: "#0a0c10", scale: 2 });
      const link = document.createElement("a");
      link.download = `skillentis-${username}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast({ title: t("dashboard.downloadedTitle") });
    } catch {
      toast({ title: t("dashboard.exportFailed"), variant: "destructive" });
    }
  }, [username, toast, t]);

  const handleDownloadPDF = useCallback(() => {
    if (!result) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const { user, metrics, yearsActive } = result;
    const esc = (s: unknown) =>
      String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    const safeName = esc(user.name || user.login);
    const safeLogin = esc(user.login);
    const safeAvatar = esc(user.avatar_url);
    const metricsHTML = [
      { label: "Consistency", value: metrics.consistency },
      { label: "Architecture", value: metrics.architecture },
      { label: "Project Scope", value: metrics.scope },
      { label: "Collaboration", value: metrics.collaboration },
      { label: "Practices", value: metrics.practices },
    ].map(m => `
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
        <span style="font-size:14px;color:#94a3b8;">${m.label}</span>
        <span style="font-size:18px;font-weight:700;">${m.value}</span>
      </div>
      <div style="height:6px;background:#1e293b;border-radius:4px;overflow:hidden;margin-bottom:16px;">
        <div style="height:100%;width:${m.value}%;background:linear-gradient(90deg,#22c55e,#06b6d4);border-radius:4px;"></div>
      </div>`).join("");

    printWindow.document.write(`<!DOCTYPE html><html><head>
      <title>${safeName} — Skillentis</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Inter:wght@400;500&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',sans-serif;background:#0a0c10;color:#e2e8f0;padding:40px}
        h1,h2{font-family:'Space Grotesk',sans-serif}.card{max-width:500px;margin:0 auto;background:#111318;border:1px solid #1e293b;border-radius:16px;padding:32px}
        .header{display:flex;align-items:center;gap:16px;margin-bottom:24px}.avatar{width:56px;height:56px;border-radius:50%}
        .codexa{text-align:center;padding:20px;background:#0d1017;border:1px solid rgba(34,197,94,0.2);border-radius:12px;margin-bottom:24px}
        .codexa-value{font-size:48px;font-weight:700;background:linear-gradient(135deg,#22c55e,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
        .footer{text-align:center;font-size:10px;color:#64748b;margin-top:20px}
        @media print{body{background:white;color:#1e293b}.card{border-color:#e2e8f0;background:white}.codexa{background:#f8fafc;border-color:#e2e8f0}}
      </style></head><body>
      <div class="card">
        <div class="header"><img class="avatar" src="${safeAvatar}" alt="${safeLogin}"/><div><h2 style="font-size:20px">${safeName}</h2><p style="font-size:12px;color:#94a3b8">@${safeLogin}</p></div></div>
        <div class="codexa"><p style="font-size:12px;color:#94a3b8;margin-bottom:4px">Codexa Index</p><p class="codexa-value">${metrics.codexaIndex}</p><p style="font-size:10px;color:#94a3b8;margin-top:4px">Based on ${yearsActive} years</p></div>
        ${metricsHTML}
        <div class="footer">Generated by Skillentis · skillentis.app</div>
      </div><script>window.onload=()=>{window.print()}</script></body></html>`);
    printWindow.document.close();
  }, [result]);

  const hasNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  if (loading) {
    const statusLabels: Record<string, string> = {
      queued: t("dashboard.queued"),
      running: t("dashboard.analyzing"),
      partial: t("dashboard.processing"),
      complete: t("dashboard.finalizing"),
      error: t("dashboard.retrying"),
    };
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Helmet htmlAttributes={{ lang: i18n.language?.startsWith("es") ? "es" : "en" }}><title>{t("seo.dashboard.analyzing", { username })}</title></Helmet>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center max-w-sm px-6">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="font-display text-lg font-semibold mb-1">
            {statusLabels[jobState.status] || t("dashboard.analyzing")} {username}...
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            {jobState.message || t("dashboard.fetching")}
          </p>
          {/* Progress bar */}
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full evolution-bar"
              initial={{ width: 0 }}
              animate={{ width: `${jobState.progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{jobState.progress}%</p>
        </motion.div>
      </div>
    );
  }

  if (error || !result) {
    const errLower = (error || "").toLowerCase();
    const isNotFound = errLower.includes("not found") || errLower.includes("no encontrado");
    const isRateLimit = errLower.includes("rate limit");
    const errorTitle = isNotFound
      ? t("dashboard.errorUserNotFound")
      : isRateLimit
        ? t("dashboard.errorRateLimit")
        : t("dashboard.failedTitle");
    const errorDesc = isNotFound
      ? t("dashboard.errorUserNotFoundDesc", { username })
      : isRateLimit
        ? t("dashboard.errorRateLimitDesc")
        : (error || t("dashboard.unknownError"));
    const isOwnUsername = !!githubUsername && githubUsername.toLowerCase() === (username || "").toLowerCase();
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Helmet htmlAttributes={{ lang: i18n.language?.startsWith("es") ? "es" : "en" }}><title>{t("seo.dashboard.failed")}</title></Helmet>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md px-6">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold mb-2">{errorTitle}</h2>
          <p className="text-muted-foreground mb-6">{errorDesc}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/" className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-primary text-primary-foreground font-display font-semibold text-sm">
              <ArrowLeft className="w-4 h-4" /> {t("dashboard.tryAnother")}
            </Link>
            {isNotFound && isOwnUsername && (
              <Link to="/settings" className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg border border-border text-foreground font-display font-semibold text-sm hover:bg-muted">
                {t("dashboard.fixInSettings")}
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  const { user, metrics, timeline, milestones, radarData, yearsActive, totalRepos, topLanguages } = result;
  const displayName = user.name || user.login;
  const pageTitle = t("seo.dashboard.profileTitle", { name: displayName });
  const pageDescription = t("seo.dashboard.profileDescription", { name: displayName });
  const lang = i18n.language?.startsWith("es") ? "es" : "en";
  const ogLocale = t("seo.locale");

  return (
    <div className="min-h-screen bg-background">
      <OfflineBanner cachedAt={cachedAt} />
      <Helmet htmlAttributes={{ lang }}>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={dashboardUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={dashboardUrl} />
        <meta property="og:type" content="profile" />
        <meta property="og:image" content={getOGImageUrl(username!)} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="Skillentis" />
        <meta property="og:locale" content={ogLocale} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={getOGImageUrl(username!)} />
      </Helmet>

      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="font-display text-lg font-bold tracking-tight">
              <span className="text-foreground">Skill</span>
              <span className="text-primary">entis</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            {githubUsername && username?.toLowerCase() === githubUsername.toLowerCase() && publicProfile && (
              <Link
                to={`/profile/${username}`}
                className="h-9 px-3 rounded-lg bg-secondary border border-primary/40 text-primary font-display text-sm font-medium flex items-center gap-2 hover:bg-primary/10 transition-colors"
                title={t("dashboard.publicProfileHint")}
              >
                <Eye className="w-4 h-4" /><span className="hidden sm:inline">{t("dashboard.viewPublicProfile")}</span>
              </Link>
            )}
            <button onClick={handleCopyLink} className="h-9 px-3 rounded-lg bg-secondary border border-border text-secondary-foreground font-display text-sm font-medium flex items-center gap-2 hover:bg-muted transition-colors">
              <Copy className="w-4 h-4" /><span className="hidden sm:inline">{t("dashboard.copyLink")}</span>
            </button>
            {hasNativeShare && (
              <button onClick={handleNativeShare} className="h-9 px-3 rounded-lg bg-secondary border border-border text-secondary-foreground text-sm flex items-center gap-2 hover:bg-muted transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
            )}
            <button onClick={handleDownloadPNG} className="h-9 px-3 rounded-lg bg-primary text-primary-foreground font-display text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity">
              <Download className="w-4 h-4" /><span className="hidden sm:inline">{t("dashboard.export")}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-6 py-8">
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
          <img src={user.avatar_url} alt={user.login} className="w-16 h-16 rounded-full border-2 border-border" />
          <div className="flex-1">
            <h1 className="font-display text-2xl sm:text-3xl font-bold">{user.name || user.login}</h1>
            <p className="text-muted-foreground text-sm">
              @{user.login} · {totalRepos} {t("common.repos")} · {yearsActive} {t("dashboard.yearsOnGithub")}
              {topLanguages.length > 0 && ` · ${topLanguages.slice(0, 3).join(", ")}`}
            </p>
            {user.bio && <p className="text-sm text-muted-foreground mt-1 italic">{user.bio}</p>}
          </div>
          <div className="flex items-center gap-2 p-4 rounded-xl bg-card border border-glow shadow-glow-sm">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">{t("dashboard.codexa")}</p>
              <p className="font-display text-3xl font-bold text-gradient-primary">{metrics.codexaIndex}</p>
              <p className="text-[10px] text-muted-foreground">{t("dashboard.basedOn", { years: yearsActive })}</p>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {[
            { icon: TrendingUp, label: t("dashboard.metrics.consistency"), value: metrics.consistency },
            { icon: GitBranch, label: t("dashboard.metrics.architecture"), value: metrics.architecture },
            { icon: Clock, label: t("dashboard.metrics.scope"), value: metrics.scope },
            { icon: Users, label: t("dashboard.metrics.collaboration"), value: metrics.collaboration },
            { icon: Code2, label: t("dashboard.metrics.practices"), value: metrics.practices },
          ].map((stat) => (
            <div key={stat.label} className="p-4 rounded-xl bg-card border border-border card-hover">
              <stat.icon className="w-4 h-4 text-primary mb-2" />
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="font-display text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Charts — lazy loaded */}
        <Suspense fallback={
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
            <div className="lg:col-span-2 p-6 rounded-xl bg-card border border-border h-[340px] flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
            </div>
            <div className="p-6 rounded-xl bg-card border border-border h-[340px] flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
            </div>
          </div>
        }>
          <LazyCharts timeline={timeline} radarData={radarData} />
        </Suspense>

        {/* Timeline — collapsible for long histories */}
        <TimelineSection milestones={milestones} />

        {/* Evolution Card + Share & Export */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }} className="mb-8">
          <h3 className="font-display font-semibold text-center mb-4">{t("dashboard.yourCard")}</h3>
          <div className="flex justify-center mb-6">
            <ShareableEvolutionCard
              ref={cardRef}
              user={user}
              metrics={metrics}
              timeline={timeline}
              yearsActive={yearsActive}
              topLanguages={topLanguages}
            />
          </div>

          {/* Share & Download */}
          <div className="p-6 rounded-xl bg-card border border-border">
            <h4 className="font-display text-sm font-semibold mb-4 text-center">{t("publicProfile.shareTitle")}</h4>
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              <button onClick={handleCopyLink} className="h-9 px-4 rounded-lg bg-secondary border border-border text-secondary-foreground font-display text-xs font-medium flex items-center gap-2 hover:bg-muted transition-colors">
                <Copy className="w-3.5 h-3.5" /> {t("dashboard.copyLink")}
              </button>
              <button onClick={handleShareLinkedIn} className="h-9 px-4 rounded-lg bg-secondary border border-border text-secondary-foreground font-display text-xs font-medium flex items-center gap-2 hover:bg-muted transition-colors">
                <Linkedin className="w-3.5 h-3.5" /> LinkedIn
              </button>
              <button onClick={handleShareTwitter} className="h-9 px-4 rounded-lg bg-secondary border border-border text-secondary-foreground font-display text-xs font-medium flex items-center gap-2 hover:bg-muted transition-colors">
                <Twitter className="w-3.5 h-3.5" /> X / Twitter
              </button>
              <button onClick={handleShareWhatsApp} className="h-9 px-4 rounded-lg bg-secondary border border-border text-secondary-foreground font-display text-xs font-medium flex items-center gap-2 hover:bg-muted transition-colors">
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </button>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <button onClick={handleDownloadPNG} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground font-display text-xs font-medium flex items-center gap-2 hover:opacity-90 transition-opacity">
                <Download className="w-3.5 h-3.5" /> {t("publicProfile.downloadPng")}
              </button>
              <button onClick={handleDownloadPDF} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground font-display text-xs font-medium flex items-center gap-2 hover:opacity-90 transition-opacity">
                <FileText className="w-3.5 h-3.5" /> {t("publicProfile.downloadPdf")}
              </button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
