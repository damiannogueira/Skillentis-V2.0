import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Github, Sparkles, Settings as SettingsIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useMyAnalyses } from "@/hooks/use-my-analyses";
import { useAccessControl } from "@/hooks/use-access-control";

const AnalyzeYourselfCard = () => {
  const { user, githubUsername, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const { items, loading: analysesLoading } = useMyAnalyses(user?.id, 50);
  const { canAnalyze } = useAccessControl();

  if (!user || authLoading || analysesLoading) return null;

  // No GitHub connected → invite to connect
  if (!githubUsername) {
    if (items.length > 0) return null;
    return (
      <section className="container max-w-5xl mx-auto px-6 -mt-4 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-5"
        >
          <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
            <Github className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight mb-1">
              {t("home.analyzeYourself.connectTitle")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("home.analyzeYourself.connectSubtitle")}
            </p>
          </div>
          <Link
            to="/settings"
            className="shrink-0 inline-flex items-center gap-2 h-11 px-5 rounded-lg bg-primary text-primary-foreground font-display font-semibold hover:opacity-90 transition-opacity"
          >
            <SettingsIcon className="w-4 h-4" />
            {t("home.analyzeYourself.connectCta")}
          </Link>
        </motion.div>
      </section>
    );
  }

  // Has GitHub but never analyzed own profile → invite to do it
  const ownAnalyzed = items.some(
    (i) => i.username.toLowerCase() === githubUsername.toLowerCase()
  );
  if (ownAnalyzed) return null;
  if (!canAnalyze) return null; // limit reached: RecentAnalysisWidget shows the upgrade CTA

  return (
    <section className="container max-w-5xl mx-auto px-6 -mt-4 mb-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card/60 to-card/60 backdrop-blur-sm p-6 sm:p-8"
      >
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
          <img
            src={`https://github.com/${githubUsername}.png?size=120`}
            alt={githubUsername}
            loading="lazy"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-primary/40 shrink-0 object-cover bg-muted"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] uppercase tracking-wider font-semibold text-primary">
                {t("home.analyzeYourself.badge")}
              </span>
            </div>
            <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight mb-1 break-words">
              {t("home.analyzeYourself.title", { username: githubUsername })}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("home.analyzeYourself.subtitle")}
            </p>
          </div>
          <Link
            to={`/dashboard/${githubUsername}`}
            className="group shrink-0 inline-flex items-center gap-2 h-11 px-5 rounded-lg bg-primary text-primary-foreground font-display font-semibold hover:opacity-90 transition-opacity"
          >
            {t("home.analyzeYourself.cta")}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </motion.div>
    </section>
  );
};

export default AnalyzeYourselfCard;
