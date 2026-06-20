import { memo } from "react";
import { useTranslation } from "react-i18next";
import BadgeIcon from "./BadgeIcon";
import type { BadgeWithStatus } from "@/hooks/use-badges";

interface BadgeRowProps {
  badges: BadgeWithStatus[];
  size?: "xs" | "sm";
  max?: number;
}

const BadgeRow = memo(({ badges, size = "xs", max = 5 }: BadgeRowProps) => {
  const { i18n } = useTranslation();
  const lang = i18n.language.startsWith("es") ? "es" : "en";
  const visible = badges.slice(0, max);
  const extra = badges.length - visible.length;

  if (badges.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      {visible.map((b) => (
        <div key={b.code} title={lang === "es" ? b.name_es : b.name_en}>
          <BadgeIcon icon={b.icon} tier={b.tier} size={size} />
        </div>
      ))}
      {extra > 0 && (
        <span className="text-[10px] text-muted-foreground font-display ml-1">+{extra}</span>
      )}
    </div>
  );
});

BadgeRow.displayName = "BadgeRow";

export default BadgeRow;
