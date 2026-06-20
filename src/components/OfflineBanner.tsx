import { motion, AnimatePresence } from "framer-motion";
import { WifiOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useOnlineStatus } from "@/hooks/use-online-status";

interface OfflineBannerProps {
  cachedAt?: number;
}

const OfflineBanner = ({ cachedAt }: OfflineBannerProps) => {
  const isOnline = useOnlineStatus();
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-center gap-2 text-sm">
            <WifiOff className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-amber-200">
              {t("offline.message")}
              {cachedAt && (
                <span className="text-amber-200/60 ml-1">
                  ({new Date(cachedAt).toLocaleDateString()})
                </span>
              )}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineBanner;
