import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Medal, TrendingUp, BarChart3, ArrowLeft, Flame, Star, Sparkles } from "lucide-react";
import BadgeRow from "@/components/BadgeRow";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/Navbar";
import { Skeleton } from "@/components/ui/skeleton";

interface LeaderboardEntry { username: string; count: number; badges?: BadgeMini[]; }
type Period = "week" | "month" | "all";

interface BadgeMini {
  code: string;
  icon: string;
  tier: "bronze" | "silver" | "gold";
  name_es: string;
  name_en: string;
}

const rankConfig = [
  { bg: "bg-yellow-500/10 border-yellow-500/30", text: "text-yellow-500", icon: Trophy },
  { bg: "bg-gray-300/10 border-gray-300/30", text: "text-gray-400", icon: Medal },
  { bg: "bg-amber-700/10 border-amber-700/30", text: "text-amber-600", icon: Medal },
];

const Leaderboard = () => {
  const { githubUsername } = useAuth();
  const { t } = useTranslation();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("all");
  const [userRank, setUserRank] = useState<{ rank: number; count: number } | null>(null);

  const myUsername = githubUsername?.toLowerCase() ?? null;

  const periodOptions: { value: Period; label: string }[] = [
    { value: "week", label: t("leaderboard.periods.week") },
    { value: "month", label: t("leaderboard.periods.month") },
    { value: "all", label: t("leaderboard.periods.all") },
  ];

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      let query = supabase.from("analysis_jobs").select("username, completed_at").eq("status", "complete");
      if (period !== "all") {
        const since = new Date();
        if (period === "week") since.setDate(since.getDate() - 7);
        else since.setMonth(since.getMonth() - 1);
        query = query.gte("completed_at", since.toISOString());
      }
      const { data, error } = await query;
      if (error || !data) { setLoading(false); return; }
      const counts: Record<string, number> = {};
      data.forEach((row) => { counts[row.username] = (counts[row.username] || 0) + 1; });
      const fullSorted = Object.entries(counts)
        .map(([username, count]) => ({ username, count }))
        .sort((a, b) => b.count - a.count);
      if (myUsername) {
        const idx = fullSorted.findIndex((e) => e.username.toLowerCase() === myUsername);
        setUserRank(idx >= 0 ? { rank: idx + 1, count: fullSorted[idx].count } : null);
      } else {
        setUserRank(null);
      }
      const top = fullSorted.slice(0, 50);

      // Fetch badges of users whose github_username matches a top entry
      const usernames = top.map((e) => e.username.toLowerCase());
      const badgesByUsername: Record<string, BadgeMini[]> = {};
      if (usernames.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, github_username")
          .in("github_username", usernames);
        const profileIds = (profilesData || []).map((p) => p.id);
        if (profileIds.length > 0) {
          const [{ data: ub }, { data: cat }] = await Promise.all([
            supabase.from("user_badges").select("user_id, badge_code").in("user_id", profileIds),
            supabase.from("badges").select("code, icon, tier, name_es, name_en, sort_order").order("sort_order"),
          ]);
          const catMap = new Map((cat || []).map((b) => [b.code, b]));
          (profilesData || []).forEach((p) => {
            const codes = (ub || []).filter((x) => x.user_id === p.id).map((x) => x.badge_code);
            const list: BadgeMini[] = codes
              .map((c) => catMap.get(c))
              .filter(Boolean)
              .map((b) => ({
                code: b!.code, icon: b!.icon, tier: b!.tier as BadgeMini["tier"],
                name_es: b!.name_es, name_en: b!.name_en,
              }));
            badgesByUsername[(p.github_username || "").toLowerCase()] = list;
          });
        }
      }
      setEntries(top.map((e) => ({ ...e, badges: badgesByUsername[e.username.toLowerCase()] || [] })));
      setLoading(false);
    };
    fetchLeaderboard();
  }, [period, myUsername]);

  return (
    <>
      <Helmet htmlAttributes={{ lang: t("seo.locale") === "es_ES" ? "es" : "en" }}>
        <title>{t("seo.leaderboard.title")}</title>
        <meta name="description" content={t("leaderboard.subtitle")} />
        <link rel="canonical" href="https://skillentisapp.com/leaderboard" />
        <meta property="og:title" content={t("seo.leaderboard.title")} />
        <meta property="og:description" content={t("leaderboard.subtitle")} />
        <meta property="og:url" content="https://skillentisapp.com/leaderboard" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content={t("seo.locale")} />
      </Helmet>

      <Navbar />

      <main className="min-h-screen bg-background pt-20 pb-16 px-4">
        <div className="container max-w-3xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> {t("common.back")}
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-display font-semibold mb-4">
              <Flame className="w-3.5 h-3.5" />
              {t("leaderboard.badge")}
            </div>

            {!loading && myUsername && userRank && userRank.rank > 50 && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-xl border border-primary/30 bg-primary/5 flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    {t("leaderboard.yourPosition")}{" "}
                    <span className="font-display font-bold text-primary">#{userRank.rank}</span>{" "}
                    {t("leaderboard.withAnalyses", { count: userRank.count })}
                  </p>
                </div>
              </motion.div>
            )}
            {!loading && myUsername && !userRank && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-xl border border-border bg-muted/30 text-sm text-muted-foreground text-center">
                {t("leaderboard.notInRanking")}
              </motion.div>
            )}
            <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-2">{t("leaderboard.title")}</h1>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">{t("leaderboard.subtitle")}</p>
          </motion.div>

          <div className="flex justify-center gap-2 mb-6">
            {periodOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`px-4 py-1.5 rounded-full text-xs font-display font-semibold border transition-all ${
                  period === opt.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-display font-semibold">{t("leaderboard.empty")}</p>
              <p className="text-sm mt-1">{t("leaderboard.emptyHint")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry, index) => {
                const isTop3 = index < 3;
                const config = rankConfig[index] || null;
                const RankIcon = config?.icon || Star;
                const isMe = myUsername && entry.username.toLowerCase() === myUsername;

                return (
                  <motion.div key={entry.username} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }}>
                    <Link
                      to={`/dashboard/${entry.username}`}
                      className={`group flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-md ${
                        isMe
                          ? "bg-primary/10 border-primary ring-2 ring-primary/30"
                          : isTop3 ? `${config!.bg} border` : "bg-card border-border hover:border-primary/20"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-display font-bold text-sm shrink-0 ${
                        isTop3 ? config!.text : "text-muted-foreground bg-muted"
                      }`}>
                        {isTop3 ? <RankIcon className="w-5 h-5" /> : <span>{index + 1}</span>}
                      </div>

                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <img src={`https://github.com/${entry.username}.png`} alt={entry.username} className="w-9 h-9 rounded-full bg-muted" loading="lazy" />
                        <div className="min-w-0 flex items-center gap-2">
                          <p className={`font-display font-semibold truncate group-hover:text-primary transition-colors ${isTop3 ? "text-base" : "text-sm"}`}>
                            {entry.username}
                          </p>
                          {isMe && (
                            <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-display font-bold uppercase tracking-wide flex items-center gap-1 shrink-0">
                              <Sparkles className="w-2.5 h-2.5" />
                              {t("leaderboard.youBadge")}
                            </span>
                          )}
                        </div>
                      </div>

                      {entry.badges && entry.badges.length > 0 && (
                        <div className="hidden md:block shrink-0">
                          <BadgeRow badges={entry.badges as never} size="xs" max={3} />
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 text-sm shrink-0">
                        <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="font-display font-semibold">{entry.count}</span>
                        <span className="text-muted-foreground text-xs hidden sm:inline">{t("common.analyses")}</span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default Leaderboard;
