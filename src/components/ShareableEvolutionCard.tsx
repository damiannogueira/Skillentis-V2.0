import { forwardRef } from "react";
import type { EvolutionMetrics, TimelinePoint } from "@/lib/analysis-engine";

interface ShareableCardProps {
  user: {
    login: string;
    name: string | null;
    avatar_url: string;
  };
  metrics: EvolutionMetrics;
  timeline: TimelinePoint[];
  yearsActive: number;
  topLanguages: string[];
}

/**
 * Prompt 9 — Shareable Developer Evolution Card
 * Self-contained visual card with: identity, evolution mini-graph, signals, Codexa Index.
 * Designed for html2canvas export (no Recharts — uses inline SVG for portability).
 */
const ShareableEvolutionCard = forwardRef<HTMLDivElement, ShareableCardProps>(
  ({ user, metrics, timeline, yearsActive, topLanguages }, ref) => {
    const signals = [
      { label: "Consistency", value: metrics.consistency, color: "hsl(155, 70%, 45%)" },
      { label: "Architecture", value: metrics.architecture, color: "hsl(185, 70%, 50%)" },
      { label: "Project Scope", value: metrics.scope, color: "hsl(155, 50%, 60%)" },
      { label: "Collaboration", value: metrics.collaboration, color: "hsl(185, 50%, 60%)" },
      { label: "Practices", value: metrics.practices, color: "hsl(155, 40%, 50%)" },
    ];

    // Build mini sparkline path from timeline (consistency signal)
    const sparklinePoints = timeline.map((t, i) => {
      const x = (i / Math.max(timeline.length - 1, 1)) * 280;
      // Composite: average of all signals for that year
      const avg = (t.consistency + t.architecture + t.scope + t.collaboration) / 4;
      const y = 40 - (avg / 100) * 36;
      return `${x},${y}`;
    });
    const sparklinePath = sparklinePoints.length > 1
      ? `M${sparklinePoints.join(" L")}`
      : "";

    // Gradient area path
    const areaPath = sparklinePath
      ? `${sparklinePath} L280,40 L0,40 Z`
      : "";

    return (
      <div
        ref={ref}
        className="w-[400px] rounded-2xl border border-glow bg-card p-6 shadow-glow relative overflow-hidden"
        style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}
      >
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl" />

        <div className="relative z-10">
          {/* Identity */}
          <div className="flex items-center gap-3 mb-5">
            <img
              src={user.avatar_url}
              alt={user.login}
              className="w-12 h-12 rounded-full border border-border"
              crossOrigin="anonymous"
            />
            <div className="flex-1 min-w-0">
              <p className="font-display font-semibold text-sm truncate">
                {user.name || user.login}
              </p>
              <p className="text-[11px] text-muted-foreground">@{user.login}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Codexa</p>
              <p className="font-display text-2xl font-bold text-gradient-primary leading-none">
                {metrics.codexaIndex}
              </p>
            </div>
          </div>

          {/* Mini Evolution Graph (SVG for html2canvas compatibility) */}
          {sparklinePath && (
            <div className="mb-5 p-3 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-2">
                Evolution · {yearsActive} years
              </p>
              <svg viewBox="0 0 280 44" className="w-full h-10" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(155, 70%, 45%)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="hsl(155, 70%, 45%)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={areaPath} fill="url(#sparkGrad)" />
                <path
                  d={sparklinePath}
                  fill="none"
                  stroke="hsl(155, 70%, 45%)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex justify-between text-[8px] text-muted-foreground mt-1">
                <span>{timeline[0]?.year}</span>
                <span>{timeline[timeline.length - 1]?.year}</span>
              </div>
            </div>
          )}

          {/* Key Signals */}
          <div className="space-y-2.5 mb-5">
            {signals.map((s) => (
              <div key={s.label}>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[10px] text-muted-foreground">{s.label}</span>
                  <span className="text-[10px] font-display font-semibold text-foreground">
                    {s.value}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ backgroundColor: s.color, width: `${s.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Languages */}
          {topLanguages.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {topLanguages.slice(0, 4).map((lang) => (
                <span
                  key={lang}
                  className="px-2 py-0.5 text-[9px] font-medium rounded-full bg-muted border border-border/50 text-muted-foreground"
                >
                  {lang}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <p className="text-[9px] text-muted-foreground text-center">
            skillentis.app · Proof of growth, not just skill
          </p>
        </div>
      </div>
    );
  }
);

ShareableEvolutionCard.displayName = "ShareableEvolutionCard";

export default ShareableEvolutionCard;
