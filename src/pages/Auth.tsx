import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2 } from "lucide-react";

type Mode = "login" | "signup" | "forgot";

const Auth = () => {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast({ title: t("auth.errors.loginTitle"), description: error.message, variant: "destructive" });
    else navigate("/");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: t("auth.errors.weakPassword"), description: t("auth.errors.weakPasswordDesc"), variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: t("auth.errors.passwordsMismatch"), variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    setLoading(false);
    if (error) toast({ title: t("auth.errors.signupTitle"), description: error.message, variant: "destructive" });
    else setEmailSent(true);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    setLoading(false);
    if (error) toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    else setEmailSent(true);
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <Helmet htmlAttributes={{ lang: t("seo.locale") === "es_ES" ? "es" : "en" }}>
          <title>{t("seo.auth.verify")}</title>
          <meta name="description" content={t("seo.auth.description")} />
          <link rel="canonical" href="https://skillentisapp.com/auth" />
          <meta property="og:title" content={t("seo.auth.verify")} />
          <meta property="og:description" content={t("seo.auth.description")} />
          <meta property="og:url" content="https://skillentisapp.com/auth" />
          <meta property="og:type" content="website" />
          <meta name="robots" content="noindex" />
        </Helmet>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm text-center">
          <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">
            {mode === "forgot" ? t("auth.emailSentTitle") : t("auth.verifyTitle")}
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            {mode === "forgot" ? t("auth.forgotDesc") : t("auth.verifyDesc")}
          </p>
          <p className="text-xs text-muted-foreground mb-4">{email}</p>
          <Button variant="outline" onClick={() => { setEmailSent(false); setMode("login"); }} className="w-full">
            {t("auth.backToLogin")}
          </Button>
        </motion.div>
      </div>
    );
  }

  const seoTitle = mode === "login" ? t("seo.auth.login") : mode === "signup" ? t("seo.auth.signup") : t("seo.auth.forgot");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 bg-gradient-hero">
      <Helmet htmlAttributes={{ lang: t("seo.locale") === "es_ES" ? "es" : "en" }}>
        <title>{seoTitle}</title>
        <meta name="description" content={t("seo.auth.description")} />
        <link rel="canonical" href="https://skillentisapp.com/auth" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={t("seo.auth.description")} />
        <meta property="og:url" content="https://skillentisapp.com/auth" />
        <meta property="og:type" content="website" />
        <meta name="robots" content="noindex" />
      </Helmet>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t("auth.back")}
        </Link>

        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold mb-1">
            <span className="text-foreground">Skill</span>
            <span className="text-primary">entis</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            {mode === "login" && t("auth.loginSubtitle")}
            {mode === "signup" && t("auth.signupSubtitle")}
            {mode === "forgot" && t("auth.forgotSubtitle")}
          </p>
        </div>

        <form
          onSubmit={mode === "login" ? handleLogin : mode === "signup" ? handleSignup : handleForgotPassword}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="email" type="email" placeholder={t("auth.emailPlaceholder")} value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
            </div>
          </div>

          {mode !== "forgot" && (
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={mode === "signup" ? t("auth.passwordMin") : t("auth.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  minLength={mode === "signup" ? 8 : undefined}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="confirmPassword" type={showPassword ? "text" : "password"} placeholder={t("auth.confirmPlaceholder")} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10" required />
              </div>
            </div>
          )}

          {mode === "login" && (
            <button type="button" onClick={() => setMode("forgot")} className="text-xs text-primary hover:underline">
              {t("auth.forgotLink")}
            </button>
          )}

          <Button type="submit" className="w-full font-display font-semibold" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === "login" && t("auth.login")}
            {mode === "signup" && t("auth.signup")}
            {mode === "forgot" && t("auth.sendLink")}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <p>
              {t("auth.noAccount")}{" "}
              <button onClick={() => setMode("signup")} className="text-primary hover:underline font-medium">
                {t("auth.signupFree")}
              </button>
            </p>
          ) : (
            <p>
              {t("auth.haveAccount")}{" "}
              <button onClick={() => setMode("login")} className="text-primary hover:underline font-medium">
                {t("auth.loginAction")}
              </button>
            </p>
          )}
        </div>

        {mode === "signup" && (
          <div className="mt-6 p-4 rounded-xl bg-card border border-border">
            <p className="font-display text-xs font-semibold mb-2">{t("auth.freePlan")}</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• {t("auth.freeIncludes1")}</li>
              <li>• {t("auth.freeIncludes2")}</li>
            </ul>
            <p className="text-xs text-primary mt-2 font-medium">{t("auth.upgradeNote")}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Auth;
