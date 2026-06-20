import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Check, Crown, Briefcase, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { usePaddleCheckout } from "@/hooks/use-paddle-checkout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

type Tier = "free" | "pro" | "pro_recruiter";

const Pricing = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { subscription, isActive } = useSubscription();
  const { openCheckout, loading } = usePaddleCheckout();
  const navigate = useNavigate();
  const [interval, setInterval] = useState<"month" | "year">("month");

  const currentTier: Tier = isActive
    ? (subscription?.product_id === "pro_recruiter_plan" ? "pro_recruiter" : "pro")
    : "free";

  const handleSubscribe = async (priceId: string) => {
    if (!user) return navigate("/auth?redirect=/pricing");
    if (isActive) return navigate("/settings");
    await openCheckout({
      priceId,
      customerEmail: user.email ?? undefined,
      customData: { userId: user.id },
      successUrl: `${window.location.origin}/settings?checkout=success`,
    });
  };

  const plans = [
    {
      tier: "free" as Tier,
      name: t("pricing.free.name"),
      price: "$0",
      desc: t("pricing.free.desc"),
      features: [
        t("pricing.free.f1"),
        t("pricing.free.f2"),
        t("pricing.free.f3"),
      ],
      icon: Sparkles,
      iconColor: "text-muted-foreground",
      border: "border-border",
      ctaLabel: currentTier === "free" ? t("pricing.currentPlan") : t("pricing.startFree"),
      ctaDisabled: currentTier === "free",
      onClick: () => navigate(user ? "/" : "/auth"),
    },
    {
      tier: "pro" as Tier,
      name: t("pricing.pro.name"),
      price: interval === "month" ? "$9" : "$90",
      perLabel: interval === "month" ? t("pricing.perMonth") : t("pricing.perYear"),
      desc: t("pricing.pro.desc"),
      features: [
        t("pricing.pro.f1"),
        t("pricing.pro.f2"),
        t("pricing.pro.f3"),
        t("pricing.pro.f4"),
        t("pricing.pro.f5"),
      ],
      icon: Crown,
      iconColor: "text-primary",
      border: "border-primary/40 ring-1 ring-primary/30",
      highlight: true,
      ctaLabel:
        currentTier === "pro" ? t("pricing.currentPlan") :
        currentTier === "pro_recruiter" ? t("pricing.manage") :
        t("pricing.startTrial"),
      ctaDisabled: currentTier === "pro" || loading,
      onClick: () => handleSubscribe(interval === "month" ? "pro_monthly" : "pro_yearly"),
    },
    {
      tier: "pro_recruiter" as Tier,
      name: t("pricing.recruiter.name"),
      price: interval === "month" ? "$29" : "$290",
      perLabel: interval === "month" ? t("pricing.perMonth") : t("pricing.perYear"),
      desc: t("pricing.recruiter.desc"),
      features: [
        t("pricing.recruiter.f1"),
        t("pricing.recruiter.f2"),
        t("pricing.recruiter.f3"),
        t("pricing.recruiter.f4"),
        t("pricing.recruiter.f5"),
      ],
      icon: Briefcase,
      iconColor: "text-accent",
      border: "border-accent/40",
      ctaLabel:
        currentTier === "pro_recruiter" ? t("pricing.currentPlan") :
        t("pricing.startTrial"),
      ctaDisabled: currentTier === "pro_recruiter" || loading,
      onClick: () => handleSubscribe(interval === "month" ? "recruiter_monthly" : "recruiter_yearly"),
    },
  ];

  return (
    <>
      <Helmet>
        <title>{t("pricing.seoTitle")}</title>
        <meta name="description" content={t("pricing.seoDesc")} />
        <link rel="canonical" href="https://skillentisapp.com/pricing" />
        <meta property="og:title" content={t("pricing.seoTitle")} />
        <meta property="og:description" content={t("pricing.seoDesc")} />
        <meta property="og:url" content="https://skillentisapp.com/pricing" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Skillentis" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Skillentis",
          applicationCategory: "DeveloperApplication",
          operatingSystem: "Web",
          url: "https://skillentisapp.com/",
          offers: [
            { "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD" },
            { "@type": "Offer", name: "Pro", price: "9", priceCurrency: "USD" },
            { "@type": "Offer", name: "Pro Recruiter", price: "29", priceCurrency: "USD" },
          ],
        })}</script>
      </Helmet>
      <PaymentTestModeBanner />
      <Navbar />
      <main className="min-h-screen bg-background pt-24 pb-16 px-4">
        <div className="container max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              {t("pricing.titleA")} <span className="text-gradient-primary">{t("pricing.titleB")}</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t("pricing.subtitle")}
            </p>
          </motion.div>

          {/* Toggle */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex bg-secondary rounded-lg p-1">
              <button
                onClick={() => setInterval("month")}
                className={`px-4 py-2 rounded-md text-sm font-display font-semibold transition-colors ${
                  interval === "month" ? "bg-background text-foreground" : "text-muted-foreground"
                }`}
              >
                {t("pricing.monthly")}
              </button>
              <button
                onClick={() => setInterval("year")}
                className={`px-4 py-2 rounded-md text-sm font-display font-semibold transition-colors flex items-center gap-2 ${
                  interval === "year" ? "bg-background text-foreground" : "text-muted-foreground"
                }`}
              >
                {t("pricing.yearly")}
                <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                  {t("pricing.save")}
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <motion.div
                  key={plan.tier}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`relative rounded-2xl border ${plan.border} bg-card p-6 flex flex-col`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-display font-semibold">
                      {t("pricing.popular")}
                    </div>
                  )}
                  <Icon className={`w-6 h-6 ${plan.iconColor} mb-4`} />
                  <h3 className="font-display font-bold text-xl mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4 min-h-[2.5rem]">{plan.desc}</p>
                  <div className="mb-6">
                    <span className="font-display font-bold text-4xl">{plan.price}</span>
                    {plan.perLabel && (
                      <span className="text-sm text-muted-foreground ml-1">{plan.perLabel}</span>
                    )}
                  </div>
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.iconColor}`} />
                        <span className="text-foreground/90">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full font-display font-semibold"
                    variant={plan.highlight ? "default" : "outline"}
                    disabled={plan.ctaDisabled}
                    onClick={plan.onClick}
                  >
                    {plan.ctaLabel}
                  </Button>
                  {plan.tier !== "free" && interval === "month" && currentTier === "free" && (
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      {t("pricing.trialNote")}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-10 max-w-2xl mx-auto">
            {t("pricing.footnote")}
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Pricing;
