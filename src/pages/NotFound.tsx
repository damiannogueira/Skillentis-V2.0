import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import BackLink from "@/components/BackLink";

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="absolute top-6 left-6">
        <BackLink to="/" />
      </div>
      <div className="text-center">
        <h1 className="mb-4 font-display text-5xl font-bold">{t("notFound.title")}</h1>
        <p className="mb-6 text-lg text-muted-foreground">{t("notFound.subtitle")}</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          {t("notFound.back")}
        </a>
      </div>
    </div>
  );
};

export default NotFound;
