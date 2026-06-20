import { Crown, ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/use-subscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const planLabel = (productId: string | undefined) => {
  if (productId === "pro_recruiter_plan") return "Pro Recruiter";
  if (productId === "pro_plan") return "Pro";
  return "Free";
};

export function SubscriptionSection() {
  const { t } = useTranslation();
  const { subscription, isActive, loading } = useSubscription();
  const [opening, setOpening] = useState(false);
  const navigate = useNavigate();

  const openPortal = async () => {
    setOpening(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error || !data?.overviewUrl) throw new Error(error?.message || "No portal URL");
      window.open(data.overviewUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setOpening(false);
    }
  };

  if (loading) return null;

  return (
    <div className="mt-6 space-y-5 p-6 rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 mb-1">
        <Crown className="w-4 h-4 text-primary" />
        <h2 className="font-display font-semibold text-base">{t("subscription.title")}</h2>
      </div>

      {!isActive ? (
        <>
          <p className="text-sm text-muted-foreground">{t("subscription.freeDesc")}</p>
          <Button onClick={() => navigate("/pricing")} className="w-full sm:w-auto">
            {t("subscription.viewPlans")}
          </Button>
        </>
      ) : (
        <>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="text-muted-foreground">{t("subscription.currentPlan")}: </span>
              <strong className="font-display">{planLabel(subscription?.product_id)}</strong>
              <span className="ml-2 text-xs px-2 py-0.5 rounded bg-primary/15 text-primary capitalize">
                {subscription?.status}
              </span>
            </p>
            {subscription?.current_period_end && (
              <p className="text-xs text-muted-foreground">
                {subscription.cancel_at_period_end || subscription.status === "canceled"
                  ? t("subscription.endsOn", { date: new Date(subscription.current_period_end).toLocaleDateString() })
                  : t("subscription.renewsOn", { date: new Date(subscription.current_period_end).toLocaleDateString() })}
              </p>
            )}
          </div>
          <Button variant="outline" onClick={openPortal} disabled={opening} className="gap-2">
            {opening ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
            {t("subscription.managePortal")}
          </Button>
        </>
      )}
    </div>
  );
}
