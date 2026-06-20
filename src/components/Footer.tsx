import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-border py-12 px-6">
      <div className="container max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="font-display text-sm font-bold tracking-tight">
          <span className="text-foreground">Skill</span>
          <span className="text-primary">entis</span>
        </div>
        <nav className="flex items-center gap-5 text-xs text-muted-foreground">
          <a href="/pricing" className="hover:text-foreground transition-colors">
            {t("nav.pricing")}
          </a>
          <a href="/leaderboard" className="hover:text-foreground transition-colors">
            {t("nav.ranking")}
          </a>
          <a href="/compare" className="hover:text-foreground transition-colors">
            {t("nav.compare")}
          </a>
        </nav>
        <p className="text-xs text-muted-foreground">
          {t("footer.tagline")} © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
