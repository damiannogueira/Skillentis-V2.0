import { memo } from "react";
import {
  Sparkles, Activity, Flame, Calendar, Github, Trophy, Crown, Star, Award,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles, Activity, Flame, Calendar, Github, Trophy, Crown, Star, Award,
};

const TIER_STYLES: Record<string, string> = {
  bronze: "bg-[hsl(25,70%,15%)] border-[hsl(25,70%,40%)] text-[hsl(25,90%,65%)]",
  silver: "bg-[hsl(210,15%,18%)] border-[hsl(210,15%,55%)] text-[hsl(210,20%,80%)]",
  gold: "bg-[hsl(45,60%,15%)] border-[hsl(45,90%,55%)] text-[hsl(45,95%,65%)]",
};

interface BadgeIconProps {
  icon: string;
  tier: "bronze" | "silver" | "gold";
  earned?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  xs: { wrap: "w-7 h-7", icon: "w-3.5 h-3.5" },
  sm: { wrap: "w-10 h-10", icon: "w-5 h-5" },
  md: { wrap: "w-14 h-14", icon: "w-7 h-7" },
  lg: { wrap: "w-20 h-20", icon: "w-10 h-10" },
};

const BadgeIcon = memo(({ icon, tier, earned = true, size = "md", className }: BadgeIconProps) => {
  const Icon = ICON_MAP[icon] || Sparkles;
  const s = SIZES[size];

  return (
    <div
      className={cn(
        "rounded-full border-2 flex items-center justify-center transition-all",
        s.wrap,
        earned ? TIER_STYLES[tier] : "bg-muted border-border text-muted-foreground/40 grayscale opacity-50",
        className
      )}
    >
      <Icon className={s.icon} />
    </div>
  );
});

BadgeIcon.displayName = "BadgeIcon";

export default BadgeIcon;
