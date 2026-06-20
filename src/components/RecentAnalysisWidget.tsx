import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Github, Sparkles, User, Crown, Lock, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useMyAnalyses } from "@/hooks/use-my-analyses";
import { useAccessControl } from "@/hooks/use-access-control";
import { Button } from "@/components/ui/button";
import UpgradeModal from "@/components/UpgradeModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const formatRelative = (iso: string, locale: string) => {
  const d = new Date(iso);
  const diffSec = Math.round((d.getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const abs = Math.abs(diffSec);
  if (abs < 60) return rtf.format(diffSec, "second");
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
  return rtf.format(Math.round(diffSec / 86400), "day");
};

const RecentAnalysisWidget = () => {
  const { user, githubUsername } = useAuth();
  const { t, i18n } = useTranslation();
  const { items, loading, remove } = useMyAnalyses(user?.id, 3);
  const { canAnalyze, monthlyLimit, role } = useAccessControl();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  if (!user || loading) return null;

  const isFree = role === "free";
  const limitReached = isFree && monthlyLimit !== null && !canAnalyze;

  if (items.length === 0 && !limitReached) return null;

  const locale = i18n.language?.startsWith("es") ? "es" : "en";
  const ownGh = githubUsername?.toLowerCase();

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    const { error } = await remove(pendingDelete);
    setDeleting(false);
    setPendingDelete(null);
    if (error) {
      toast.error(t("home.recentAnalysis.deleteError"));
    } else {
      toast.success(t("home.recentAnalysis.deleteSuccess"));
    }
  };

  return (
    <section className="container max-w-5xl mx-auto px-6 -mt-4 mb-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-6 sm:p-8"
      >
        {limitReached ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5 p-4 rounded-xl border border-primary/30 bg-primary/5">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="shrink-0 w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                <Lock className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-base sm:text-lg font-bold tracking-tight">
                  {t("home.recentAnalysis.limitTitle")}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {t("home.recentAnalysis.limitSubtitle")}
                </p>
              </div>
            </div>
            <Button
              onClick={() => setUpgradeOpen(true)}
              className="font-display font-semibold shrink-0 sm:self-center"
            >
              <Crown className="w-4 h-4" />
              {t("home.recentAnalysis.upgradeCta")}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight">
                {t("home.recentAnalysis.title")}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              {t("home.recentAnalysis.subtitle")}
            </p>
          </>
        )}

        {items.length > 0 && (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((a) => {
              const isOwn = a.username.toLowerCase() === ownGh;
              return (
                <li key={a.username} className="relative group/item">
                  <Link
                    to={`/dashboard/${a.username}`}
                    className="group flex items-center gap-3 p-3 pr-10 rounded-xl border border-border bg-background/40 hover:bg-muted hover:border-border/80 transition-all duration-200"
                  >
                    <img
                      src={`https://github.com/${a.username}.png?size=80`}
                      alt={a.username}
                      loading="lazy"
                      className="w-10 h-10 rounded-full border border-border shrink-0 object-cover bg-muted"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Github className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="font-display font-semibold text-sm truncate">
                          @{a.username}
                        </span>
                        {isOwn && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] uppercase tracking-wide font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                            <User className="w-2.5 h-2.5" />
                            {t("home.recentAnalysis.yourProfile")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatRelative(a.analyzed_at, locale)}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 transition-all duration-200 group-hover:text-primary group-hover:translate-x-0.5" />
                  </Link>
                  <button
                    type="button"
                    aria-label={t("home.recentAnalysis.delete")}
                    title={t("home.recentAnalysis.delete")}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setPendingDelete(a.username);
                    }}
                    className="absolute top-1.5 right-1.5 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-60 sm:opacity-0 sm:group-hover/item:opacity-100 focus:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </motion.div>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && !deleting && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("home.recentAnalysis.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("home.recentAnalysis.deleteDescription", { username: pendingDelete ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              {t("home.recentAnalysis.deleteCancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("home.recentAnalysis.deleteConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

export default RecentAnalysisWidget;
