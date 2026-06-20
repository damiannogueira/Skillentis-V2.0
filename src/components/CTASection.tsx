import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Github, ArrowRight, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useAccessControl } from "@/hooks/use-access-control";
import UpgradeModal from "@/components/UpgradeModal";

const CTASection = () => {
  const [username, setUsername] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canAnalyze } = useAccessControl();
  const { t } = useTranslation();

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    if (!user) return navigate("/auth");
    if (!canAnalyze) return setShowUpgrade(true);
    navigate(`/dashboard/${username.trim()}`);
  };

  return (
    <section className="py-20 sm:py-32 px-4 sm:px-6 bg-gradient-hero">
      <div className="container max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            {t("cta.titleA")} <span className="text-gradient-primary">{t("cta.titleB")}</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-10">{t("cta.subtitle")}</p>

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
              {!user ? <><Lock className="w-4 h-4" /> {t("nav.signIn")}</> : <>{t("hero.ctaAnalyze")} <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="mt-4 text-xs text-muted-foreground">
            {user ? t("cta.footerAuth") : t("cta.footerGuest")}
          </p>
        </motion.div>
      </div>

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} feature={t("hero.usageUnlimited")} />
    </section>
  );
};

export default CTASection;
