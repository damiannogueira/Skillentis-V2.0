import { motion } from "framer-motion";
import { TrendingUp, GitBranch, Users, BarChart3, Clock, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

const SolutionSection = () => {
  const { t } = useTranslation();

  const flow = [
    { key: "data", icon: GitBranch },
    { key: "engine", icon: BarChart3 },
    { key: "profile", icon: TrendingUp },
  ] as const;

  const signals = [
    { key: "consistency", icon: TrendingUp },
    { key: "architecture", icon: GitBranch },
    { key: "scope", icon: Clock },
    { key: "collaboration", icon: Users },
    { key: "practices", icon: BarChart3 },
  ] as const;

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gradient-hero">
      <div className="container max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            {t("solution.titleA")} <span className="text-gradient-primary">{t("solution.titleB")}</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t("solution.subtitle")}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-16"
        >
          {flow.map((step, i) => (
            <div key={step.key} className="flex items-center gap-4 sm:gap-6">
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-xl bg-card border border-glow shadow-glow-sm flex items-center justify-center">
                  <step.icon className="w-7 h-7 text-primary" />
                </div>
                <span className="text-xs font-display font-medium text-muted-foreground">{t(`solution.flow.${step.key}`)}</span>
              </div>
              {i < 2 && <ArrowRight className="w-5 h-5 text-muted-foreground hidden sm:block" />}
            </div>
          ))}
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {signals.map((s, i) => (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
              className="p-4 rounded-xl bg-card border border-border text-center card-hover"
            >
              <s.icon className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="font-display text-sm font-semibold mb-1">{t(`solution.signals.${s.key}.label`)}</p>
              <p className="text-xs text-muted-foreground">{t(`solution.signals.${s.key}.desc`)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
