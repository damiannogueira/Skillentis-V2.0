import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock } from "lucide-react";
import BackLink from "@/components/BackLink";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) setReady(true);
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: t("resetPassword.weakPassword"), description: t("resetPassword.weakDesc"), variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: t("resetPassword.mismatch"), variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("resetPassword.updated") });
      navigate("/");
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Helmet htmlAttributes={{ lang: t("seo.locale") === "es_ES" ? "es" : "en" }}><title>{t("seo.resetPassword.title")}</title></Helmet>
        <p className="text-muted-foreground">{t("resetPassword.invalidLink")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <Helmet htmlAttributes={{ lang: t("seo.locale") === "es_ES" ? "es" : "en" }}>
        <title>{t("seo.resetPassword.title")}</title>
        <meta name="description" content={t("seo.resetPassword.description")} />
        <link rel="canonical" href="https://skillentisapp.com/reset-password" />
        <meta property="og:url" content="https://skillentisapp.com/reset-password" />
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="absolute top-6 left-6"><BackLink to="/" /></div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-bold text-center mb-6">{t("resetPassword.title")}</h1>
        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("resetPassword.newPassword")}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="password" placeholder={t("resetPassword.passwordPlaceholder")} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" required minLength={8} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("resetPassword.confirmPassword")}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="password" placeholder={t("resetPassword.confirmPlaceholder")} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10" required />
            </div>
          </div>
          <Button type="submit" className="w-full font-display font-semibold" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {t("resetPassword.submit")}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
