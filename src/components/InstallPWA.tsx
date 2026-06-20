import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Share, Smartphone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/use-pwa-install";

const InstallPWA = () => {
  const { canInstall, isIOS, isInstalled, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const { t } = useTranslation();

  if (isInstalled || dismissed || !canInstall) return null;

  const handleInstall = async () => {
    if (isIOS) setShowIOSGuide(true);
    else { await install(); setDismissed(true); }
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ delay: 2, type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl border border-border bg-card/95 backdrop-blur-md p-4 shadow-2xl"
        >
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-3 right-3 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3">
            <img src="/pwa-192x192.png" alt="Skillentis" className="h-12 w-12 rounded-xl shrink-0 border border-border" />
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-sm">{t("installPwa.title")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isIOS ? t("installPwa.iosSubtitle") : t("installPwa.defaultSubtitle")}
              </p>
              <Button size="sm" className="mt-2 h-7 text-xs gap-1.5" onClick={handleInstall}>
                {isIOS ? <Share className="h-3 w-3" /> : <Download className="h-3 w-3" />}
                {isIOS ? t("installPwa.iosCta") : t("installPwa.defaultCta")}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showIOSGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end justify-center bg-background/60 backdrop-blur-sm p-4"
            onClick={() => setShowIOSGuide(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-display font-bold">{t("installPwa.iosTitle")}</p>
                  <p className="text-xs text-muted-foreground">{t("installPwa.iosRequired")}</p>
                </div>
              </div>
              <ol className="space-y-3 text-sm">
                {(["step1", "step2", "step3"] as const).map((s, i) => (
                  <li key={s} className="flex items-start gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold">{i + 1}</span>
                    <span className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: t(`installPwa.${s}`) }} />
                  </li>
                ))}
              </ol>
              <Button className="mt-5 w-full" onClick={() => { setShowIOSGuide(false); setDismissed(true); }}>
                {t("installPwa.understood")}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default InstallPWA;
