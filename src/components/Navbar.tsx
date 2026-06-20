import { Download, Smartphone, LogIn, LogOut, Crown, Settings as SettingsIcon, Languages, Share } from "lucide-react";
import { usePWAInstall } from "@/hooks/use-pwa-install";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NotificationsBell from "@/components/NotificationsBell";

const InstallButton = () => {
  const { canInstall, isIOS, isInstalled, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const { t } = useTranslation();

  if (isInstalled || !canInstall) return null;

  const handleClick = async () => {
    if (isIOS) setShowIOSModal(true);
    else await install();
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={handleClick}
        className="gap-1.5 text-xs h-8 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
      >
        {isIOS ? <Smartphone className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
        <span className="hidden sm:inline">{t("nav.install")}</span>
      </Button>

      <AnimatePresence>
        {showIOSModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end justify-center bg-background/60 backdrop-blur-sm p-4"
            onClick={() => setShowIOSModal(false)}
          >
            <motion.div
              initial={{ y: 60 }}
              animate={{ y: 0 }}
              exit={{ y: 60 }}
              className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="font-display font-bold mb-3">{t("installPwa.iosTitle")}</p>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li>1. <span dangerouslySetInnerHTML={{ __html: t("installPwa.step1") }} /></li>
                <li>2. <span dangerouslySetInnerHTML={{ __html: t("installPwa.step2") }} /></li>
                <li>3. <span dangerouslySetInnerHTML={{ __html: t("installPwa.step3") }} /></li>
              </ol>
              <Button className="mt-4 w-full" onClick={() => setShowIOSModal(false)}>{t("common.close")}</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const LangSwitcher = () => {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith("es") ? "ES" : "EN";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-xs px-2">
          <Languages className="h-3.5 w-3.5" />
          <span>{current}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[8rem]">
        <DropdownMenuItem onClick={() => i18n.changeLanguage("es")}>Español</DropdownMenuItem>
        <DropdownMenuItem onClick={() => i18n.changeLanguage("en")}>English</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const roleBadge: Record<string, { label: string; color: string }> = {
  pro: { label: "Pro", color: "text-primary" },
  pro_recruiter: { label: "Recruiter", color: "text-accent" },
};

const Navbar = () => {
  const { user, role, signOut } = useAuth();
  const { t } = useTranslation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <a href="/" className="font-display text-lg font-bold tracking-tight">
          <span className="text-foreground">Skill</span>
          <span className="text-primary">entis</span>
        </a>

        <div className="flex items-center gap-3">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            {t("nav.features")}
          </a>
          <a href="/compare" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            {t("nav.compare")}
          </a>
          <a href="/leaderboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            {t("nav.ranking")}
          </a>
          <a href="/dashboard/torvalds" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            {t("nav.demo")}
          </a>
          <a href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            {t("nav.pricing")}
          </a>
          <LangSwitcher />
          <InstallButton />

          {user ? (
            <div className="flex items-center gap-2">
              {role !== "free" && roleBadge[role] && (
                <span className={`text-xs font-display font-semibold ${roleBadge[role].color} flex items-center gap-1`}>
                  <Crown className="w-3 h-3" />
                  {roleBadge[role].label}
                </span>
              )}
              <span className="text-xs text-muted-foreground hidden sm:block max-w-[120px] truncate">
                {user.email}
              </span>
              <NotificationsBell />
              <a
                href="/settings"
                className="text-muted-foreground hover:text-foreground transition-colors"
                title={t("nav.settings")}
              >
                <SettingsIcon className="h-4 w-4" />
              </a>
              <Button
                size="sm"
                variant="ghost"
                onClick={signOut}
                className="gap-1.5 text-xs h-8"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t("nav.signOut")}</span>
              </Button>
            </div>
          ) : (
            <a
              href="/auth"
              className="h-9 px-4 rounded-lg bg-primary text-primary-foreground font-display text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <LogIn className="w-4 h-4" />
              {t("nav.signIn")}
            </a>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
