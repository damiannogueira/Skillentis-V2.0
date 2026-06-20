import { useRef, useCallback, useEffect, useState } from "react";
import ShareableEvolutionCard from "@/components/ShareableEvolutionCard";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  ArrowRight, Github, TrendingUp, GitBranch, Users, Clock, Code2,
  Loader2, AlertCircle, Share2, Copy, Linkedin, Download, FileText, Twitter,
  MessageCircle, Lock,
} from "lucide-react";
import html2canvas from "html2canvas";
import { getOGImageUrl } from "@/lib/og-utils";
import { useGitHubAnalysis } from "@/hooks/use-github-analysis";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useUserBadges, useUserIdByGithub } from "@/hooks/use-badges";
import BadgesGrid from "@/components/BadgesGrid";
import BackLink from "@/components/BackLink";
import { supabase } from "@/integrations/supabase/client";

type Visibility = { public_profile: boolean; owner_role: "free" | "pro" | "pro_recruiter" } | null;

const PublicProfile = () => {
  const { username } = useParams();
  const { result, loading, error } = useGitHubAnalysis(username);
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const ownerUserId = useUserIdByGithub(username);
  const { badges: userBadges } = useUserBadges(ownerUserId);
  const [visibility, setVisibility] = useState<Visibility>(null);
  const [visibilityLoading, setVisibilityLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    setVisibilityLoading(true);
    supabase
      .rpc("get_profile_visibility", { _github_username: username })
      .then(({ data }) => {
        const row = Array.isArray(data) && data.length > 0 ? data[0] : null;
        setVisibility(row ? { public_profile: row.public_profile, owner_role: row.owner_role } : null);
        setVisibilityLoading(false);
      });
  }, [username]);

  const profileUrl = `${window.location.origin}/profile/${username}`;

  const handleCopyLink = useCallback(async () => {
    await navigator.clipboard.writeText(profileUrl);
    toast({ title: t("publicProfile.linkCopied"), description: t("publicProfile.linkCopiedDesc") });
  }, [profileUrl, toast, t]);

  const handleShareLinkedIn = useCallback(() => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`,
      "_blank"
    );
  }, [profileUrl]);

  const handleShareTwitter = useCallback(() => {
    const text = encodeURIComponent(
      `I analyzed my GitHub evolution using @Skillentis. Here's my developer growth profile 🚀`
    );
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(profileUrl)}`,
      "_blank"
    );
  }, [profileUrl]);

  const handleShareWhatsApp = useCallback(() => {
    const text = encodeURIComponent(
      `Check out my developer evolution profile on Skillentis: ${profileUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }, [profileUrl]);

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${username} — Developer Evolution Profile`,
        text: "Check out my developer evolution on Skillentis",
        url: profileUrl,
      });
    }
  }, [username, profileUrl]);

  const handleDownloadPNG = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#0a0c10",
        scale: 2,
      });
      const link = document.createElement("a");
      link.download = `skillentis-${username}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast({ title: t("publicProfile.linkCopied").replace("Link", "Card").replace("Enlace", "Tarjeta"), description: t("publicProfile.downloadedDesc") });
    } catch {
      toast({ title: t("dashboard.exportFailed"), variant: "destructive" });
    }
  }, [username, toast, t]);

  const handleDownloadPDF = useCallback(() => {
    // Open a print-friendly version in a new window
    const printWindow = window.open("", "_blank");
    if (!printWindow || !result) return;

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
    ]
      .map(
        (m) => `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-size:14px;color:#94a3b8;">${m.label}</span>
          <span style="font-size:18px;font-weight:700;">${m.value}</span>
        </div>
        <div style="height:6px;background:#1e293b;border-radius:4px;overflow:hidden;margin-bottom:16px;">
          <div style="height:100%;width:${m.value}%;background:linear-gradient(90deg,#22c55e,#06b6d4);border-radius:4px;"></div>
        </div>`
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${safeName} — Skillentis Evolution Profile</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Inter:wght@400;500&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', sans-serif; background: #0a0c10; color: #e2e8f0; padding: 40px; }
          h1, h2, h3 { font-family: 'Space Grotesk', sans-serif; }
          .card { max-width: 500px; margin: 0 auto; background: #111318; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; }
          .header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
          .avatar { width: 56px; height: 56px; border-radius: 50%; }
          .codexa { text-align: center; padding: 20px; background: #0d1017; border: 1px solid rgba(34,197,94,0.2); border-radius: 12px; margin-bottom: 24px; }
          .codexa-value { font-size: 48px; font-weight: 700; background: linear-gradient(135deg, #22c55e, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          .footer { text-align: center; font-size: 10px; color: #64748b; margin-top: 20px; }
          @media print { body { background: white; color: #1e293b; } .card { border-color: #e2e8f0; background: white; } .codexa { background: #f8fafc; border-color: #e2e8f0; } }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <img class="avatar" src="${safeAvatar}" alt="${safeLogin}" />
            <div>
              <h2 style="font-size:20px;">${safeName}</h2>
              <p style="font-size:12px;color:#94a3b8;">@${safeLogin}</p>
            </div>
          </div>
          <div class="codexa">
            <p style="font-size:12px;color:#94a3b8;margin-bottom:4px;">Codexa Index</p>
            <p class="codexa-value">${metrics.codexaIndex}</p>
            <p style="font-size:10px;color:#94a3b8;margin-top:4px;">Based on ${yearsActive} years of GitHub evolution</p>
          </div>
          ${metricsHTML}
          <div class="footer">Generated by Skillentis · skillentis.app</div>
        </div>
        <script>window.onload = () => { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }, [result]);

  if (loading || visibilityLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Helmet htmlAttributes={{ lang: i18n.language?.startsWith("es") ? "es" : "en" }}>
          <title>{t("seo.publicProfile.loading")}</title>
        </Helmet>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="font-display text-lg font-semibold">{t("publicProfile.loading")}</p>
        </motion.div>
      </div>
    );
  }

  // Gating: profile owner has set their profile to private
  if (visibility && !visibility.public_profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Helmet htmlAttributes={{ lang: i18n.language?.startsWith("es") ? "es" : "en" }}>
          <title>{t("publicProfile.privateTitle")}</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md px-6">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-muted-foreground" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-2">{t("publicProfile.privateTitle")}</h2>
          <p className="text-muted-foreground mb-6">{t("publicProfile.privateDesc")}</p>
          <Link to="/" className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-primary text-primary-foreground font-display font-semibold text-sm">
            {t("common.backHome")}
          </Link>
        </motion.div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Helmet htmlAttributes={{ lang: i18n.language?.startsWith("es") ? "es" : "en" }}>
          <title>{t("seo.publicProfile.notFound")}</title>
        </Helmet>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md px-6">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold mb-2">{t("publicProfile.notFound")}</h2>
          <p className="text-muted-foreground mb-6">{error || t("publicProfile.notFoundDesc")}</p>
          <Link to="/" className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-primary text-primary-foreground font-display font-semibold text-sm">
            {t("publicProfile.discover")}
          </Link>
        </motion.div>
      </div>
    );
  }

  const { user, metrics, timeline, yearsActive, totalRepos, topLanguages } = result;
  const displayName = user.name || user.login;
  const pageTitle = t("seo.publicProfile.title", { name: displayName });
  const pageDescription = t("seo.publicProfile.description", { name: displayName });
  const lang = i18n.language?.startsWith("es") ? "es" : "en";
  const ogLocale = t("seo.locale");

  const metricsList = [
    { icon: TrendingUp, label: t("dashboard.metrics.consistency"), value: metrics.consistency, color: "hsl(var(--primary))" },
    { icon: GitBranch, label: t("dashboard.metrics.architecture"), value: metrics.architecture, color: "hsl(var(--accent))" },
    { icon: Clock, label: t("dashboard.metrics.scope"), value: metrics.scope, color: "hsl(155, 50%, 60%)" },
    { icon: Users, label: t("dashboard.metrics.collaboration"), value: metrics.collaboration, color: "hsl(185, 50%, 60%)" },
    { icon: Code2, label: t("dashboard.metrics.practices"), value: metrics.practices, color: "hsl(155, 40%, 50%)" },
  ];

  const hasNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <div className="min-h-screen bg-background">
      <Helmet htmlAttributes={{ lang }}>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={profileUrl} />

        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={profileUrl} />
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
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          url: profileUrl,
          mainEntity: {
            "@type": "Person",
            name: displayName,
            alternateName: user.login,
            image: user.avatar_url,
            url: profileUrl,
            description: user.bio || pageDescription,
          },
        })}</script>
      </Helmet>

      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container max-w-3xl mx-auto px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BackLink to="/" />
            <Link to="/" className="font-display text-lg font-bold tracking-tight hidden sm:inline">
              <span className="text-foreground">Skill</span>
              <span className="text-primary">entis</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {hasNativeShare && (
              <button
                onClick={handleNativeShare}
                className="h-9 px-3 rounded-lg bg-secondary border border-border text-secondary-foreground text-sm flex items-center gap-2 hover:bg-muted transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}
            <Link
              to={`/dashboard/${username}`}
              className="h-9 px-4 rounded-lg bg-primary text-primary-foreground font-display text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              {t("publicProfile.fullDashboard")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="container max-w-3xl mx-auto px-6 py-12">
        {/* Profile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <img src={user.avatar_url} alt={user.login} className="w-24 h-24 rounded-full border-2 border-border mx-auto mb-4" />
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-1">{user.name || user.login}</h1>
          <p className="text-muted-foreground">@{user.login} · {totalRepos} {t("publicProfile.repositories")} · {yearsActive} {t("common.years")}</p>
          {user.bio && <p className="text-muted-foreground mt-2 max-w-md mx-auto italic">{user.bio}</p>}
          {topLanguages.length > 0 && (
            <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
              {topLanguages.slice(0, 5).map((lang) => (
                <span key={lang} className="px-3 py-1 text-xs font-medium rounded-full bg-secondary border border-border text-secondary-foreground">
                  {lang}
                </span>
              ))}
            </div>
          )}
        </motion.div>

        {/* Codexa Index */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="p-8 rounded-2xl bg-card border border-glow shadow-glow text-center mb-8"
        >
          <p className="text-sm text-muted-foreground mb-2">{t("publicProfile.codexa")}</p>
          <p className="font-display text-6xl font-bold text-gradient-primary mb-2">{metrics.codexaIndex}</p>
          <p className="text-xs text-muted-foreground">{t("publicProfile.basedOn", { years: yearsActive })}</p>
        </motion.div>

        {/* Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="space-y-4 mb-10"
        >
          {metricsList.map((metric) => (
            <div key={metric.label} className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <metric.icon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-display font-medium">{metric.label}</span>
                </div>
                <span className="font-display font-bold text-lg">{metric.value}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${metric.value}%` }}
                  transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: metric.color }}
                />
              </div>
            </div>
          ))}
        </motion.div>

        {/* Badges */}
        {userBadges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-10"
          >
            <BadgesGrid badges={userBadges} title={t("badges.userBadges")} />
          </motion.div>
        )}

        {/* Evolution Card for export */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mb-10"
        >
          <h3 className="font-display font-semibold text-center mb-4">{t("publicProfile.yourCard")}</h3>
          <div className="flex justify-center">
            <ShareableEvolutionCard
              ref={cardRef}
              user={user}
              metrics={metrics}
              timeline={timeline}
              yearsActive={yearsActive}
              topLanguages={topLanguages}
            />
          </div>
        </motion.div>

        {/* Share & Download Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="p-6 rounded-xl bg-card border border-border mb-10"
        >
          <h3 className="font-display font-semibold mb-4 text-center">{t("publicProfile.shareTitle")}</h3>

          {/* Social share */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            <button onClick={handleCopyLink} className="h-10 px-4 rounded-lg bg-secondary border border-border text-secondary-foreground font-display text-sm font-medium flex items-center gap-2 hover:bg-muted transition-colors">
              <Copy className="w-4 h-4" /> {t("publicProfile.copyLink")}
            </button>
            <button onClick={handleShareLinkedIn} className="h-10 px-4 rounded-lg bg-secondary border border-border text-secondary-foreground font-display text-sm font-medium flex items-center gap-2 hover:bg-muted transition-colors">
              <Linkedin className="w-4 h-4" /> LinkedIn
            </button>
            <button onClick={handleShareTwitter} className="h-10 px-4 rounded-lg bg-secondary border border-border text-secondary-foreground font-display text-sm font-medium flex items-center gap-2 hover:bg-muted transition-colors">
              <Twitter className="w-4 h-4" /> X / Twitter
            </button>
            <button onClick={handleShareWhatsApp} className="h-10 px-4 rounded-lg bg-secondary border border-border text-secondary-foreground font-display text-sm font-medium flex items-center gap-2 hover:bg-muted transition-colors">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </button>
          </div>

          {/* Downloads */}
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={handleDownloadPNG} className="h-10 px-4 rounded-lg bg-primary text-primary-foreground font-display text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity">
              <Download className="w-4 h-4" /> {t("publicProfile.downloadPng")}
            </button>
            <button onClick={handleDownloadPDF} className="h-10 px-4 rounded-lg bg-primary text-primary-foreground font-display text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity">
              <FileText className="w-4 h-4" /> {t("publicProfile.downloadPdf")}
            </button>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-center">
          <p className="text-muted-foreground text-sm mb-4">{t("publicProfile.discoverYours")}</p>
          <Link to="/" className="inline-flex items-center gap-2 h-11 px-6 rounded-lg bg-primary text-primary-foreground font-display font-semibold hover:opacity-90 transition-opacity">
            <Github className="w-4 h-4" /> {t("publicProfile.analyzeGithub")}
          </Link>
          <p className="text-[10px] text-muted-foreground mt-6">{t("publicProfile.poweredBy")}</p>
        </motion.div>
      </main>

      {/* Watermark for Free-tier owners */}
      {visibility?.owner_role === "free" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="sticky bottom-0 left-0 right-0 z-40 border-t border-border bg-background/90 backdrop-blur-md"
        >
          <div className="container max-w-3xl mx-auto px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
              {t("publicProfile.watermarkText")}
            </p>
            <Link
              to="/"
              className="text-xs font-display font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              {t("publicProfile.watermarkCta")}
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PublicProfile;
