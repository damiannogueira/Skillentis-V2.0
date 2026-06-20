import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Crown, Briefcase, X, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  feature?: string;
}

const UpgradeModal = ({ open, onClose, feature }: UpgradeModalProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const goToPricing = () => {
    onClose();
    navigate("/pricing");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-background/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="font-display text-xl font-bold">{t("upgrade.title")}</h2>
                {feature && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("upgrade.requires", { feature })}
                  </p>
                )}
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl border border-primary/30 bg-primary/5 relative">
                <Crown className="w-5 h-5 text-primary mb-3" />
                <h3 className="font-display font-bold text-lg mb-1">{t("upgrade.pro.name")}</h3>
                <p className="text-2xl font-display font-bold text-primary mb-3">$9<span className="text-sm text-muted-foreground font-normal">{t("upgrade.perMonth")}</span></p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                  {(["f1", "f2", "f3", "f4"] as const).map((k) => (
                    <li key={k} className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary" /> {t(`upgrade.pro.${k}`)}</li>
                  ))}
                </ul>
                <Button className="w-full font-display font-semibold" onClick={goToPricing}>{t("upgrade.viewPlans")}</Button>
              </div>

              <div className="p-5 rounded-xl border border-accent/30 bg-accent/5">
                <Briefcase className="w-5 h-5 text-accent mb-3" />
                <h3 className="font-display font-bold text-lg mb-1">{t("upgrade.recruiter.name")}</h3>
                <p className="text-2xl font-display font-bold mb-3" style={{ color: "hsl(var(--accent))" }}>$29<span className="text-sm text-muted-foreground font-normal">{t("upgrade.perMonth")}</span></p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                  {(["f1", "f2", "f3", "f4"] as const).map((k) => (
                    <li key={k} className="flex items-center gap-2"><Check className="w-3.5 h-3.5" style={{ color: "hsl(var(--accent))" }} /> {t(`upgrade.recruiter.${k}`)}</li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full font-display font-semibold" onClick={goToPricing}>{t("upgrade.viewPlans")}</Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UpgradeModal;
