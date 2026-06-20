import { motion } from "framer-motion";
import { Shield, TrendingUp, Clock, GitBranch, Users, BarChart3 } from "lucide-react";
import { useTranslation } from "react-i18next";

const components = [
  { icon: TrendingUp, key: "consistency", weight: "30%" },
  { icon: Clock, key: "evolution", weight: "20%" },
  { icon: GitBranch, key: "architecture", weight: "20%" },
  { icon: Users, key: "collaboration", weight: "15%" },
  { icon: BarChart3, key: "practices", weight: "15%" },
] as const;

const CodexaSection = () => {
  const { t } = useTranslation();
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gradient-hero">
      <div className="container max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="order-2 lg:order-1"
          >
            <div className="max-w-sm mx-auto lg:mx-0">
              <div className="p-8 rounded-2xl bg-card border border-glow shadow-glow text-center mb-6">
                <Shield className="w-10 h-10 text-primary mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-2">{t("codexa.label")}</p>
                <p className="font-display text-7xl font-bold text-gradient-primary mb-2">65</p>
                <p className="text-xs text-muted-foreground">{t("codexa.basedOn")}</p>
              </div>

              <div className="space-y-2">
                {components.map((c) => (
                  <div key={c.key} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                    <c.icon className="w-4 h-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-display font-medium">{t(`codexa.components.${c.key}.label`)}</span>
                        <span className="text-[10px] text-muted-foreground">{c.weight}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="order-1 lg:order-2"
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              {t("codexa.titleA")} <span className="text-gradient-primary">{t("codexa.titleB")}</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">{t("codexa.intro")}</p>
            <div className="space-y-4">
              {components.map((c) => (
                <div key={c.key} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <c.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-display font-medium">
                      {t(`codexa.components.${c.key}.label`)} <span className="text-muted-foreground font-normal">({c.weight})</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{t(`codexa.components.${c.key}.desc`)}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-6 italic">{t("codexa.summary")}</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CodexaSection;
