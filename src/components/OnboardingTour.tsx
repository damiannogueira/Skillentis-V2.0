import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Github, Trophy, GitCompare, Share2, Check, X, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "skillentis_onboarding_v1";

type Step = {
  icon: React.ComponentType<{ className?: string }>;
  titleKey: string;
  bodyKey: string;
};

const STEPS: Step[] = [
  { icon: Sparkles, titleKey: "onboarding.s1.title", bodyKey: "onboarding.s1.body" },
  { icon: Github, titleKey: "onboarding.s2.title", bodyKey: "onboarding.s2.body" },
  { icon: Trophy, titleKey: "onboarding.s3.title", bodyKey: "onboarding.s3.body" },
  { icon: GitCompare, titleKey: "onboarding.s4.title", bodyKey: "onboarding.s4.body" },
  { icon: Share2, titleKey: "onboarding.s5.title", bodyKey: "onboarding.s5.body" },
];

const OnboardingTour = () => {
  const { user, githubUsername, loading } = useAuth();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (loading || !user) return;
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
      // Delay slightly so user sees the page first
      const timer = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(timer);
    } catch {
      // localStorage unavailable — skip silently
    }
  }, [loading, user]);

  const finish = () => {
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {}
    setOpen(false);
  };

  if (!user || !open) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  // CTA on the last step depends on whether GitHub is connected
  const finalCta = githubUsername
    ? { to: `/dashboard/${githubUsername}`, label: t("onboarding.ctaAnalyze") }
    : { to: "/settings", label: t("onboarding.ctaConnect") };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        <motion.div
          initial={{ y: 30, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg rounded-2xl border border-primary/30 bg-card shadow-2xl overflow-hidden"
        >
          <button
            onClick={finish}
            aria-label={t("onboarding.skip")}
            className="absolute top-3 right-3 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="px-7 pt-8 pb-2">
            <div className="flex items-center gap-1.5 mb-4">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1 rounded-full transition-all ${
                    i === step ? "w-8 bg-primary" : i < step ? "w-4 bg-primary/60" : "w-4 bg-muted"
                  }`}
                />
              ))}
            </div>

            <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
              <Icon className="w-6 h-6 text-primary" />
            </div>

            <h2 id="onboarding-title" className="font-display text-2xl font-bold tracking-tight mb-2">
              {t(current.titleKey, { username: githubUsername ?? "" })}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t(current.bodyKey)}
            </p>
          </div>

          <div className="px-7 pt-6 pb-6 flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={isFirst ? finish : () => setStep((s) => s - 1)}
              className="gap-1.5"
            >
              {isFirst ? (
                t("onboarding.skip")
              ) : (
                <>
                  <ArrowLeft className="w-3.5 h-3.5" />
                  {t("onboarding.back")}
                </>
              )}
            </Button>

            {isLast ? (
              <Link
                to={finalCta.to}
                onClick={finish}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-primary text-primary-foreground font-display font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                <Check className="w-4 h-4" />
                {finalCta.label}
              </Link>
            ) : (
              <Button onClick={() => setStep((s) => s + 1)} size="sm" className="gap-1.5">
                {t("onboarding.next")}
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingTour;
