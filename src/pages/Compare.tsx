import { useState, useCallback, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Search, Loader2, TrendingUp, GitBranch, Users, Clock, Code2,
  GitCompareArrows, Lock,
} from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Legend,
} from "recharts";
import { useGitHubAnalysis } from "@/hooks/use-github-analysis";
import type { AnalysisResult } from "@/lib/analysis-engine";
import { useAuth } from "@/hooks/use-auth";
import { useAccessControl } from "@/hooks/use-access-control";
import UpgradeModal from "@/components/UpgradeModal";
import { useTranslation } from "react-i18next";

/* ── Metric bar comparison ── */
const MetricBar = ({
  label, icon: Icon, valueA, valueB, nameA, nameB,
}: {
  label: string; icon: React.ElementType;
  valueA: number; valueB: number; nameA: string; nameB: string;
}) => {
  const diff = valueA - valueB;
  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-primary" />
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-primary font-display font-semibold">{nameA}</span>
          <span className="font-display font-bold text-lg">{valueA}</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary" style={{ width: `${valueA}%` }} />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-accent font-display font-semibold">{nameB}</span>
          <span className="font-display font-bold text-lg">{valueB}</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-accent" style={{ width: `${valueB}%` }} />
        </div>
        {diff !== 0 && (
          <p className="text-[10px] text-muted-foreground text-right">
            {diff > 0 ? `${nameA} +${diff}` : `${nameB} +${Math.abs(diff)}`}
          </p>
        )}
      </div>
    </div>
  );
};

/* ── Dual radar chart ── */
const DualRadar = ({ a, b, nameA, nameB }: {
  a: AnalysisResult; b: AnalysisResult; nameA: string; nameB: string;
}) => {
  const data = [
    { metric: "Consistency", [nameA]: a.metrics.consistency, [nameB]: b.metrics.consistency },
    { metric: "Architecture", [nameA]: a.metrics.architecture, [nameB]: b.metrics.architecture },
    { metric: "Scope", [nameA]: a.metrics.scope, [nameB]: b.metrics.scope },
    { metric: "Collaboration", [nameA]: a.metrics.collaboration, [nameB]: b.metrics.collaboration },
    { metric: "Practices", [nameA]: a.metrics.practices, [nameB]: b.metrics.practices },
  ];

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={data}>
        <PolarGrid stroke="hsl(220, 14%, 14%)" />
        <PolarAngleAxis dataKey="metric" stroke="hsl(215, 12%, 50%)" fontSize={12} />
        <Radar name={nameA} dataKey={nameA} stroke="hsl(155, 70%, 45%)" fill="hsl(155, 70%, 45%)" fillOpacity={0.2} />
        <Radar name={nameB} dataKey={nameB} stroke="hsl(185, 70%, 50%)" fill="hsl(185, 70%, 50%)" fillOpacity={0.2} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </RadarChart>
    </ResponsiveContainer>
  );
};

/* ── Single user input + analysis ── */
const UserSlot = ({
  slot, username, setUsername, onAnalyze, result, loading, error, jobState,
}: {
  slot: "A" | "B";
  username: string; setUsername: (v: string) => void;
  onAnalyze: () => void;
  result: AnalysisResult | null; loading: boolean; error: string | null;
  jobState: { progress: number; message: string | null };
}) => {
  const color = slot === "A" ? "primary" : "accent";
  return (
    <div className="flex-1 min-w-0">
      <label className="text-xs font-display font-semibold text-muted-foreground mb-2 block">
        Developer {slot}
      </label>
      <div className="flex gap-2">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value.trim())}
          onKeyDown={(e) => e.key === "Enter" && onAnalyze()}
          placeholder="GitHub username"
          className="flex-1 h-10 rounded-lg bg-card border border-border px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={onAnalyze}
          disabled={!username || loading}
          className={`h-10 px-4 rounded-lg bg-${color} text-${color}-foreground font-display text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50`}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </button>
      </div>
      {loading && (
        <div className="mt-2">
          <div className="h-1 rounded-full bg-muted overflow-hidden">
            <motion.div className={`h-full rounded-full bg-${color}`} animate={{ width: `${jobState.progress}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">{jobState.message || "Analyzing..."}</p>
        </div>
      )}
      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
      {result && !loading && (
        <div className="mt-3 flex items-center gap-3">
          <img src={result.user.avatar_url} alt={result.user.login} className="w-8 h-8 rounded-full border border-border" />
          <div>
            <p className="text-sm font-display font-semibold">{result.user.name || result.user.login}</p>
            <p className="text-[10px] text-muted-foreground">Codexa {result.metrics.codexaIndex} · {result.yearsActive}y</p>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Wrapper hook for on-demand analysis ── */
function useOnDemandAnalysis() {
  const [activeUsername, setActiveUsername] = useState<string | undefined>();
  const analysis = useGitHubAnalysis(activeUsername);
  const trigger = useCallback((u: string) => setActiveUsername(u), []);
  return { ...analysis, trigger, activeUsername };
}

/* ── Main page ── */
const Compare = () => {
  const [usernameA, setUsernameA] = useState("");
  const [usernameB, setUsernameB] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { canCompare } = useAccessControl();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  const slotA = useOnDemandAnalysis();
  const slotB = useOnDemandAnalysis();

  const bothReady = !!slotA.result && !!slotB.result && !slotA.loading && !slotB.loading;
  const nameA = slotA.result?.user.login || usernameA;
  const nameB = slotB.result?.user.login || usernameB;

  const metrics = [
    { label: t("compare.metrics.consistency"), icon: TrendingUp, key: "consistency" as const },
    { label: t("compare.metrics.architecture"), icon: GitBranch, key: "architecture" as const },
    { label: t("compare.metrics.scope"), icon: Clock, key: "scope" as const },
    { label: t("compare.metrics.collaboration"), icon: Users, key: "collaboration" as const },
    { label: t("compare.metrics.practices"), icon: Code2, key: "practices" as const },
  ];

  if (!authLoading && user && !canCompare) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <Helmet htmlAttributes={{ lang: t("seo.locale") === "es_ES" ? "es" : "en" }}><title>{t("compare.proOnly")} — Skillentis</title></Helmet>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
          <Lock className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold mb-2">{t("compare.proOnly")}</h2>
          <p className="text-muted-foreground text-sm mb-6">{t("compare.proDesc")}</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button onClick={() => setShowUpgrade(true)} className="h-10 px-6 rounded-lg bg-primary text-primary-foreground font-display font-semibold text-sm hover:opacity-90 transition-opacity">
              {t("compare.viewPlans")}
            </button>
            <Link to="/" className="h-10 px-6 rounded-lg border border-border bg-card text-foreground font-display font-semibold text-sm hover:bg-accent/10 transition-colors inline-flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              {t("common.backHome")}
            </Link>
          </div>
          <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} feature={t("compare.feature")} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet htmlAttributes={{ lang: t("seo.locale") === "es_ES" ? "es" : "en" }}>
        <title>{t("seo.compare.title")}</title>
        <meta name="description" content={t("compare.subtitle")} />
        <link rel="canonical" href="https://skillentisapp.com/compare" />
        <meta property="og:title" content={t("seo.compare.title")} />
        <meta property="og:description" content={t("compare.subtitle")} />
        <meta property="og:url" content="https://skillentisapp.com/compare" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content={t("seo.locale")} />
      </Helmet>

      <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container max-w-6xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="font-display text-lg font-bold tracking-tight">
            <span className="text-foreground">Skill</span>
            <span className="text-primary">entis</span>
          </span>
          <span className="text-xs text-muted-foreground font-display">/ {t("nav.compare")}</span>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-full border border-border bg-card">
            <GitCompareArrows className="w-4 h-4 text-primary" />
            <span className="text-xs font-display font-semibold">{t("compare.badge")}</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">{t("compare.title")}</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">{t("compare.subtitle")}</p>
        </motion.div>

        {/* Input slots */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4 mb-10 p-6 rounded-xl bg-card border border-border"
        >
          <UserSlot
            slot="A" username={usernameA} setUsername={setUsernameA}
            onAnalyze={() => slotA.trigger(usernameA)}
            result={slotA.result} loading={slotA.loading} error={slotA.error} jobState={slotA.jobState}
          />
          <div className="hidden sm:flex items-center justify-center">
            <div className="w-px h-16 bg-border" />
          </div>
          <UserSlot
            slot="B" username={usernameB} setUsername={setUsernameB}
            onAnalyze={() => slotB.trigger(usernameB)}
            result={slotB.result} loading={slotB.loading} error={slotB.error} jobState={slotB.jobState}
          />
        </motion.div>

        {/* Comparison results */}
        <AnimatePresence>
          {bothReady && slotA.result && slotB.result && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Codexa head-to-head */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="p-6 rounded-xl bg-card border border-border text-center">
                  <img src={slotA.result.user.avatar_url} alt="" className="w-12 h-12 rounded-full mx-auto mb-2 border-2 border-primary" />
                  <p className="font-display font-bold">{slotA.result.user.name || nameA}</p>
                  <p className="font-display text-3xl font-bold text-primary mt-1">{slotA.result.metrics.codexaIndex}</p>
                  <p className="text-[10px] text-muted-foreground">{slotA.result.yearsActive} years · {slotA.result.totalRepos} repos</p>
                </div>
                <div className="flex items-center justify-center">
                  <div className="p-4 rounded-xl border border-border bg-card">
                    <p className="text-xs text-muted-foreground text-center mb-1">Codexa Δ</p>
                    <p className="font-display text-2xl font-bold text-center text-gradient-primary">
                      {Math.abs(slotA.result.metrics.codexaIndex - slotB.result.metrics.codexaIndex)}
                    </p>
                  </div>
                </div>
                <div className="p-6 rounded-xl bg-card border border-border text-center">
                  <img src={slotB.result.user.avatar_url} alt="" className="w-12 h-12 rounded-full mx-auto mb-2 border-2 border-accent" />
                  <p className="font-display font-bold">{slotB.result.user.name || nameB}</p>
                  <p className="font-display text-3xl font-bold text-accent mt-1">{slotB.result.metrics.codexaIndex}</p>
                  <p className="text-[10px] text-muted-foreground">{slotB.result.yearsActive} years · {slotB.result.totalRepos} repos</p>
                </div>
              </div>

              {/* Dual radar */}
              <div className="p-6 rounded-xl bg-card border border-border mb-8">
                <h3 className="font-display font-semibold mb-4 text-center">Skills Radar</h3>
                <DualRadar a={slotA.result} b={slotB.result} nameA={nameA} nameB={nameB} />
              </div>

              {/* Metric bars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {metrics.map((m) => (
                  <MetricBar
                    key={m.key}
                    label={m.label}
                    icon={m.icon}
                    valueA={slotA.result!.metrics[m.key]}
                    valueB={slotB.result!.metrics[m.key]}
                    nameA={nameA}
                    nameB={nameB}
                  />
                ))}
              </div>

              {/* Languages comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {[
                  { data: slotA.result, name: nameA, color: "primary" },
                  { data: slotB.result, name: nameB, color: "accent" },
                ].map(({ data, name, color }) => (
                  <div key={name} className="p-5 rounded-xl bg-card border border-border">
                    <p className={`text-xs font-display font-semibold text-${color} mb-3`}>
                      {name} — Top Languages
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {data.topLanguages.slice(0, 8).map((lang) => (
                        <span key={lang} className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-xs">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Compare;
