import { motion } from "framer-motion";
import { XCircle, FileText, Clock, Brain } from "lucide-react";
import { useTranslation } from "react-i18next";

const items = [
  { icon: FileText, key: "resumes" },
  { icon: Clock, key: "challenges" },
  { icon: XCircle, key: "scores" },
  { icon: Brain, key: "talent" },
] as const;

const ProblemSection = () => {
  const { t } = useTranslation();
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6">
      <div className="container max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            {t("problem.titleA")} <span className="text-gradient-primary">{t("problem.titleB")}</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t("problem.subtitle")}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item, i) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-6 rounded-xl bg-card border border-border card-hover group"
            >
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center mb-4 group-hover:bg-destructive/20 transition-colors">
                <item.icon className="w-5 h-5 text-destructive" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">{t(`problem.items.${item.key}.title`)}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t(`problem.items.${item.key}.description`)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
