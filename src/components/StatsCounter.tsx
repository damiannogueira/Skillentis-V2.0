import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Activity, Users, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

interface Stats { total: number; developers: number; thisWeek: number; }

const useCountUp = (target: number, duration = 1500, start = false) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let frame: number;
    const startTime = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) frame = requestAnimationFrame(animate);
      else setValue(target);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, start]);
  return value;
};

const StatItem = ({ value, label, icon: Icon, delay, inView, locale }: {
  value: number; label: string; icon: typeof Activity; delay: number; inView: boolean; locale: string;
}) => {
  const animated = useCountUp(value, 1800, inView);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.5 }}
      className="flex flex-col items-center text-center p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors"
    >
      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-3xl md:text-4xl font-display font-bold tracking-tight tabular-nums">
        {animated.toLocaleString(locale)}
      </div>
      <p className="text-xs text-muted-foreground mt-1 font-display font-semibold uppercase tracking-wider">{label}</p>
    </motion.div>
  );
};

const StatsCounter = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [stats, setStats] = useState<Stats>({ total: 0, developers: 0, thisWeek: 0 });
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("es") ? "es-ES" : "en-US";

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("analysis_jobs").select("username, completed_at").eq("status", "complete");
      if (!data) return;
      const developers = new Set(data.map((r) => r.username)).size;
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const thisWeek = data.filter((r) => r.completed_at && new Date(r.completed_at).getTime() >= weekAgo).length;
      setStats({ total: data.length, developers, thisWeek });
    };
    load();
  }, []);

  return (
    <section ref={ref} className="py-16 px-4 bg-background">
      <div className="container max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-display font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            {t("stats.badge")}
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight">{t("stats.title")}</h2>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatItem value={stats.total} label={t("stats.totalAnalyses")} icon={Activity} delay={0.1} inView={inView} locale={locale} />
          <StatItem value={stats.developers} label={t("stats.developers")} icon={Users} delay={0.2} inView={inView} locale={locale} />
          <StatItem value={stats.thisWeek} label={t("stats.thisWeek")} icon={Sparkles} delay={0.3} inView={inView} locale={locale} />
        </div>
      </div>
    </section>
  );
};

export default StatsCounter;
