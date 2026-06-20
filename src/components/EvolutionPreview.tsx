import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const EvolutionPreview = () => {
  const { t } = useTranslation();
  const years = [
    { year: "2020", width: "15%", opacity: 0.5 },
    { year: "2021", width: "30%", opacity: 0.6 },
    { year: "2022", width: "50%", opacity: 0.7 },
    { year: "2023", width: "70%", opacity: 0.85 },
    { year: "2024", width: "85%", opacity: 0.95 },
    { year: "2025", width: "95%", opacity: 1 },
  ];

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
            {t("evolutionPreview.titleA")} <span className="text-gradient-primary">{t("evolutionPreview.titleB")}</span>
          </h2>
          <p className="text-muted-foreground text-lg">{t("evolutionPreview.subtitle")}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-xl border border-border bg-card p-4 sm:p-8 shadow-glow"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-display font-bold text-primary text-sm">
              LT
            </div>
            <div>
              <p className="font-display font-semibold">{t("evolutionPreview.header")}</p>
              <p className="text-xs text-muted-foreground">{t("evolutionPreview.headerSub")}</p>
            </div>
          </div>

          <div className="space-y-4">
            {years.map((item, i) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-4"
              >
                <span className="text-sm font-display font-medium text-muted-foreground w-10 shrink-0">
                  {item.year}
                </span>
                <div className="flex-1 h-8 rounded-md bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: item.width }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.5 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full evolution-bar rounded-md"
                    style={{ opacity: item.opacity }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-44 shrink-0 hidden sm:block">
                  {t(`evolutionPreview.years.${item.year}`)}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default EvolutionPreview;
