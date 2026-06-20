import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Github, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useAccessControl } from "@/hooks/use-access-control";
import UpgradeModal from "@/components/UpgradeModal";
import { cleanGithubUsername, isValidGithubUsername } from "@/lib/github-username";
import { toast } from "sonner";

const HeroSection = () => {
  const [username, setUsername] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canAnalyze, monthlyUsed, monthlyLimit } = useAccessControl();
  const { t } = useTranslation();

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = cleanGithubUsername(username);
    if (!clean) return;
    if (!isValidGithubUsername(clean)) {
      toast.error(t("errors.invalidUsername"));
      return;
    }
    if (!user) return navigate("/auth");
    if (!canAnalyze) return setShowUpgrade(true);
    navigate(`/dashboard/${clean}`);
  };

  return (
    <section className="relative min-h-[85vh] sm:min-h-[92vh] flex items-center justify-center bg-gradient-hero overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 container max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-glow bg-muted/50 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
            <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
              {t("hero.badge")}
            </span>
          </div>

          <h1 className="font-display text-[2.25rem] sm:text-5xl md:text-7xl font-bold leading-[1.08] tracking-tight mb-5">
            {t("hero.titleA")}
            <br />
            <span className="text-gradient-primary">{t("hero.titleB")}</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed">
            {t("hero.subtitle")}
          </p>

          <form onSubmit={handleAnalyze} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <div className="relative flex-1">
              <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t("hero.placeholder")}
                className="w-full h-12 pl-12 pr-4 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
              />
            </div>
            <button
              type="submit"
              className="h-12 px-6 rounded-lg bg-primary text-primary-foreground font-display font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              {!user ? (
                <>
                  <Lock className="w-4 h-4" />
                  {t("hero.ctaSignIn")}
                </>
              ) : (
                <>
                  {t("hero.ctaAnalyze")}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-4 text-xs text-muted-foreground">
            {user
              ? monthlyLimit !== null
                ? t("hero.usageWithLimit", { used: monthlyUsed, limit: monthlyLimit })
                : t("hero.usageUnlimited")
              : t("hero.usageGuest")}
          </p>
        </motion.div>
      </div>

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} feature={t("hero.usageUnlimited")} />
    </section>
  );
};

export default HeroSection;
