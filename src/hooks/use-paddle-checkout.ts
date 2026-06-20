import { useState } from "react";
import { initializePaddle, getPaddlePriceId } from "@/lib/paddle";
import { toast } from "sonner";

interface OpenOptions {
  priceId: string;
  customerEmail?: string;
  customData?: Record<string, string>;
  successUrl?: string;
}

export function usePaddleCheckout() {
  const [loading, setLoading] = useState(false);

  const openCheckout = async (options: OpenOptions) => {
    setLoading(true);
    try {
      await initializePaddle();
      const paddlePriceId = await getPaddlePriceId(options.priceId);
      window.Paddle.Checkout.open({
        items: [{ priceId: paddlePriceId, quantity: 1 }],
        customer: options.customerEmail ? { email: options.customerEmail } : undefined,
        customData: options.customData,
        settings: {
          displayMode: "overlay",
          successUrl: options.successUrl || `${window.location.origin}/settings?checkout=success`,
          allowLogout: false,
          variant: "one-page",
        },
      });
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  return { openCheckout, loading };
}
