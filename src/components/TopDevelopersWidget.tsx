import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Medal, ArrowRight, TrendingUp, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

interface Entry {
  username: string;
  count: number;
}

const rankIcons = [
  { icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  { icon: Medal, color: "text-gray-400", bg: "bg-gray-400/10" },
  { icon: Medal, color: "text-amber-600", bg: "bg-amber-600/10" },
];

const TopDevelopersWidget = () => {
  const { githubUsername } = useAuth();
  const { t } = useTranslation();
  const myUsername = githubUsername?.toLowerCase() ?? null;
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("analysis_jobs").select("username").eq("status", "complete");
      if (!data) { setLoading(false); return; }
      const counts: Record<string, number> = {};
      data.forEach((r) => { counts[r.username] = (counts[r.username] || 0) + 1; });
      const sorted = Object.entries(counts)
        .map(([username, count]) => ({ username, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setEntries(sorted);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <section className="py-20 px-4 bg-background">
      <div className="container max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-display font-semibold mb-4">
            <TrendingUp className="w-3.5 h-3.5" />
            {t("topDevelopers.trending")}
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-2">
            {t("topDevelopers.title")}
          </h2>
          <p className="text-muted-foreground text-sm">{t("topDevelopers.subtitle")}</p>
        </motion.div>

        {loading ? (
          <div className="space-y-2 max-w-2xl mx-auto">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm">{t("topDevelopers.empty")}</p>
        ) : (
          <div className="space-y-2 max-w-2xl mx-auto">
            {entries.map((entry, index) => {
              const config = rankIcons[index];
              const RankIcon = config?.icon;
              const isTop3 = index < 3;
              const isMe = myUsername && entry.username.toLowerCase() === myUsername;
              return (
                <motion.div
                  key={entry.username}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={`/dashboard/${entry.username}`}
                    className={`group flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-md ${
                      isMe
                        ? "bg-primary/10 border-primary ring-2 ring-primary/30"
                        : "border-border bg-card hover:border-primary/30"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-display font-bold text-sm shrink-0 ${
                        isTop3 ? `${config.bg} ${config.color}` : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isTop3 && RankIcon ? <RankIcon className="w-5 h-5" /> : index + 1}
                    </div>
                    <img
                      src={`https://github.com/${entry.username}.png`}
                      alt={entry.username}
                      className="w-9 h-9 rounded-full bg-muted"
                      loading="lazy"
                    />
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <p className="font-display font-semibold truncate group-hover:text-primary transition-colors">
                        {entry.username}
                      </p>
                      {isMe && (
                        <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-display font-bold uppercase tracking-wide flex items-center gap-1 shrink-0">
                          <Sparkles className="w-2.5 h-2.5" />
                          {t("topDevelopers.youBadge")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <span className="font-display font-semibold text-foreground">{entry.count}</span>
                      <span className="text-xs">{t("common.analyses")}</span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="text-center mt-8">
          <Link
            to="/leaderboard"
            className="inline-flex items-center gap-1.5 text-sm font-display font-semibold text-primary hover:gap-2 transition-all"
          >
            {t("topDevelopers.viewFull")} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default TopDevelopersWidget;
