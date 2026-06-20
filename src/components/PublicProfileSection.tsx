import { motion } from "framer-motion";
import { ExternalLink, Share2, Linkedin, FileText } from "lucide-react";
import { useTranslation, Trans } from "react-i18next";

const items = [
  { icon: Share2, key: "share" },
  { icon: Linkedin, key: "linkedin" },
  { icon: FileText, key: "download" },
  { icon: ExternalLink, key: "public" },
] as const;

const PublicProfileSection = () => {
  const { t } = useTranslation();
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6">
      <div className="container max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              {t("publicProfileSection.titleA")} <span className="text-gradient-primary">{t("publicProfileSection.titleB")}</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
              <Trans
                i18nKey="publicProfileSection.description"
                values={{ url: "skillentis.app/profile/username" }}
                components={{ 1: <span className="text-foreground font-medium" /> }}
              />
            </p>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.key} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t(`publicProfileSection.items.${item.key}`)}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="rounded-2xl border border-glow bg-card p-6 shadow-glow"
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="w-3 h-3 rounded-full bg-destructive/60" />
              <div className="w-3 h-3 rounded-full bg-accent/40" />
              <div className="w-3 h-3 rounded-full bg-primary/40" />
              <span className="ml-2 text-[10px] sm:text-xs text-muted-foreground font-mono truncate">skillentis.app/profile/torvalds</span>
            </div>

            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center font-display font-bold text-primary text-lg mx-auto mb-3">
                LT
              </div>
              <p className="font-display font-semibold text-lg">{t("publicProfileSection.preview.name")}</p>
              <p className="text-xs text-muted-foreground">{t("publicProfileSection.preview.meta")}</p>
            </div>

            <div className="p-4 rounded-xl bg-muted/30 border border-border text-center mb-4">
              <p className="text-xs text-muted-foreground mb-1">{t("publicProfileSection.preview.codexa")}</p>
              <p className="font-display text-4xl font-bold text-gradient-primary">65</p>
            </div>

            <div className="space-y-2">
              {([
                { key: "consistency", value: 82 },
                { key: "architecture", value: 39 },
                { key: "collaboration", value: 49 },
              ] as const).map((m) => (
                <div key={m.key} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-24 shrink-0">{t(`solution.signals.${m.key}.label`)}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full evolution-bar" style={{ width: `${m.value}%` }} />
                  </div>
                  <span className="text-xs font-display font-semibold w-6 text-right">{m.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default PublicProfileSection;
