import { useState, useEffect, useContext, createContext, ReactNode } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAInstallContextValue {
  canInstall: boolean;
  isIOS: boolean;
  isInstalled: boolean;
  install: () => Promise<void>;
}

const PWAInstallContext = createContext<PWAInstallContextValue>({
  canInstall: false,
  isIOS: false,
  isInstalled: false,
  install: async () => {},
});

export const usePWAInstall = () => useContext(PWAInstallContext);

export const PWAInstallProvider = ({ children }: { children: ReactNode }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    if (standalone) { setIsInstalled(true); return; }

    const ua = navigator.userAgent;
    const isiOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as Record<string, unknown>).MSStream;
    setIsIOS(isiOS);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const canInstall = !!deferredPrompt || isIOS;

  return (
    <PWAInstallContext.Provider value={{ canInstall, isIOS, isInstalled, install }}>
      {children}
    </PWAInstallContext.Provider>
  );
};
