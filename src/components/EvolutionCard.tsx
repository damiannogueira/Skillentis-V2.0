import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const metricKeys = [
  { key: "consistency", value: 82, color: "hsl(var(--primary))" },
  { key: "architecture", value: 39, color: "hsl(var(--accent))" },
  { key: "evolution", value: 79, color: "hsl(155, 50%, 60%)" },
  { key: "collaboration", value: 49, color: "hsl(185, 50%, 60%)" },
] as const;

const EvolutionCard = () => {
  const { t } = useTranslation();
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6">
      <div className="container max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            {t("evolutionCard.titleA")} <span className="text-gradient-primary">{t("evolutionCard.titleB")}</span>
          </h2>
          <p className="text-muted-foreground text-lg">{t("evolutionCard.subtitle")}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-sm mx-auto"
        >
          <div className="rounded-2xl border border-glow bg-card p-6 shadow-glow relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-display font-bold text-primary">
                  LT
                </div>
                <div>
                  <p className="font-display font-semibold">Linus Torvalds</p>
                  <p className="text-xs text-muted-foreground">{t("evolutionCard.linuxCreator")}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {metricKeys.map((metric) => (
                  <div key={metric.key}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-muted-foreground">{t(`evolutionCard.metrics.${metric.key}`)}</span>
                      <span className="text-xs font-display font-semibold text-foreground">{metric.value}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${metric.value}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: metric.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                <span className="text-xs text-muted-foreground">{t("evolutionCard.codexa")}</span>
                <span className="font-display text-2xl font-bold text-gradient-primary">65</span>
              </div>

              <p className="text-[10px] text-muted-foreground text-center mt-4">{t("evolutionCard.footer")}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default EvolutionCard;
