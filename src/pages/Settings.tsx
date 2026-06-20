import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Github, Save, Check, Eye, ExternalLink, Copy, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import BackLink from "@/components/BackLink";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import BadgesGrid from "@/components/BadgesGrid";
import { useBadges } from "@/hooks/use-badges";
import { SubscriptionSection } from "@/components/SubscriptionSection";

const Settings = () => {
  const { user, githubUsername, publicProfile, loading, refreshProfile } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [privacySaving, setPrivacySaving] = useState(false);
  const { badges, refresh: refreshBadges } = useBadges(user?.id);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  useEffect(() => {
    setValue(githubUsername ?? "");
  }, [githubUsername]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { cleanGithubUsername, isValidGithubUsername } = await import("@/lib/github-username");
    const clean = cleanGithubUsername(value);
    if (clean && !isValidGithubUsername(clean)) {
      toast.error(t("errors.invalidUsername"));
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ github_username: clean || null })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(t("settings.errorToast"));
      return;
    }
    await supabase.rpc("check_and_award_badges", { _user_id: user.id });
    await refreshProfile();
    await refreshBadges();
    toast.success(t("settings.savedToast"));
  };

  const handleTogglePublic = async (next: boolean) => {
    if (!user) return;
    setPrivacySaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ public_profile: next })
      .eq("id", user.id);
    setPrivacySaving(false);
    if (error) {
      toast.error(t("settings.privacy.saveError"));
      return;
    }
    await refreshProfile();
    toast.success(next ? t("settings.privacy.savedPublic") : t("settings.privacy.savedPrivate"));
  };

  const profileUrl = githubUsername
    ? `${window.location.origin}/profile/${githubUsername}`
    : null;

  const handleCopyUrl = async () => {
    if (!profileUrl) return;
    await navigator.clipboard.writeText(profileUrl);
    toast.success(t("settings.privacy.urlCopied"));
  };

  return (
    <>
      <Helmet htmlAttributes={{ lang: t("seo.locale") === "es_ES" ? "es" : "en" }}>
        <title>{t("seo.settings.title")}</title>
        <meta name="description" content={t("seo.settings.description")} />
        <link rel="canonical" href="https://skillentisapp.com/settings" />
        <meta property="og:title" content={t("seo.settings.title")} />
        <meta property="og:description" content={t("seo.settings.description")} />
        <meta property="og:url" content="https://skillentisapp.com/settings" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content={t("seo.locale")} />
        <meta name="robots" content="noindex" />
      </Helmet>
      <Navbar />
      <main className="min-h-screen bg-background pt-20 pb-16 px-4">
        <div className="container max-w-xl mx-auto">
          <BackLink to="/" className="mb-8" />

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-display font-bold tracking-tight mb-2">{t("settings.title")}</h1>
            <p className="text-muted-foreground text-sm mb-8">{t("settings.subtitle")}</p>

            {/* GitHub username */}
            <form onSubmit={handleSave} className="space-y-5 p-6 rounded-xl border border-border bg-card">
              <div className="space-y-2">
                <Label htmlFor="github" className="flex items-center gap-2">
                  <Github className="w-4 h-4" />
                  {t("settings.githubLabel")}
                </Label>
                <Input
                  id="github"
                  placeholder={t("settings.placeholder")}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">{t("settings.hint")}</p>
              </div>

              <Button type="submit" disabled={saving} className="w-full gap-2">
                {saving ? (
                  t("common.saving")
                ) : githubUsername === value.trim().replace(/^@/, "") && githubUsername ? (
                  <><Check className="w-4 h-4" /> {t("common.saved")}</>
                ) : (
                  <><Save className="w-4 h-4" /> {t("common.save")}</>
                )}
              </Button>
            </form>

            {/* Privacy */}
            <div className="mt-6 space-y-5 p-6 rounded-xl border border-border bg-card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {publicProfile ? (
                      <Eye className="w-4 h-4 text-primary" />
                    ) : (
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    )}
                    <h2 className="font-display font-semibold text-base">
                      {t("settings.privacy.title")}
                    </h2>
                  </div>
                  <p className="text-sm font-medium mt-2">{t("settings.privacy.publicProfile")}</p>
                  <p className="text-xs text-muted-foreground mt-1 break-words">
                    {t("settings.privacy.publicProfileDesc", {
                      url: githubUsername ? `skillentis.app/profile/${githubUsername}` : "skillentis.app/profile/...",
                    })}
                  </p>
                </div>
                <Switch
                  checked={publicProfile}
                  onCheckedChange={handleTogglePublic}
                  disabled={privacySaving}
                  aria-label={t("settings.privacy.publicProfile")}
                />
              </div>

              {profileUrl && publicProfile && (
                <div className="space-y-2 pt-3 border-t border-border">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t("settings.privacy.urlLabel")}
                  </Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input value={profileUrl} readOnly className="flex-1 font-mono text-xs" />
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={handleCopyUrl} className="gap-1.5">
                        <Copy className="w-3.5 h-3.5" />
                        {t("settings.privacy.copyUrl")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        asChild
                        className="gap-1.5"
                      >
                        <a href={profileUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3.5 h-3.5" />
                          {t("settings.privacy.openProfile")}
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {!githubUsername && (
                <p className="text-xs text-muted-foreground italic pt-3 border-t border-border">
                  {t("settings.privacy.needsGithub")}
                </p>
              )}
            </div>

            <SubscriptionSection />

            <div className="mt-8">
              <BadgesGrid badges={badges} showAll title={t("badges.yourBadges")} />
            </div>
          </motion.div>
        </div>
      </main>
    </>
  );
};

export default Settings;
