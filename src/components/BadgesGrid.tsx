import { memo } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import BadgeIcon from "./BadgeIcon";
import type { BadgeWithStatus } from "@/hooks/use-badges";

interface BadgesGridProps {
  badges: BadgeWithStatus[];
  showAll?: boolean; // if true also shows locked badges in gray
  title?: string;
}

const BadgesGrid = memo(({ badges, showAll = false, title }: BadgesGridProps) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith("es") ? "es" : "en";
  const visible = showAll ? badges : badges.filter((b) => b.earned);
  const earnedCount = badges.filter((b) => b.earned).length;

  if (visible.length === 0 && !showAll) return null;

  return (
    <div className="p-6 rounded-xl bg-card border border-border">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display font-semibold">{title || t("badges.title")}</h3>
        <span className="text-xs text-muted-foreground font-display">
          {earnedCount}/{badges.length}
        </span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
        {visible.map((b, i) => (
          <motion.div
            key={b.code}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            className="flex flex-col items-center text-center group"
            title={lang === "es" ? b.description_es : b.description_en}
          >
            <BadgeIcon icon={b.icon} tier={b.tier} earned={b.earned} size="md" />
            <p className="text-[11px] font-display font-medium mt-2 leading-tight">
              {lang === "es" ? b.name_es : b.name_en}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight line-clamp-2">
              {lang === "es" ? b.description_es : b.description_en}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
});

BadgesGrid.displayName = "BadgesGrid";

export default BadgesGrid;
