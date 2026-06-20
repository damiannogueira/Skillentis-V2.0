import { createContext, useContext, useEffect, useRef, useCallback, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { showNotification } from "@/lib/notifications";

const STORAGE_KEY = "skillentis_pending_jobs";
const POLL_MS = 3000;

type Pending = { jobId: string; username: string; startedAt: number };

interface WatcherCtx {
  track: (jobId: string, username: string) => void;
  untrack: (jobId: string) => void;
}

const Ctx = createContext<WatcherCtx>({ track: () => {}, untrack: () => {} });
export const useAnalysisWatcher = () => useContext(Ctx);

function readStore(): Pending[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Pending[];
    // GC: drop > 30 min
    const cutoff = Date.now() - 30 * 60 * 1000;
    return arr.filter((p) => p.startedAt > cutoff);
  } catch {
    return [];
  }
}

function writeStore(items: Pending[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function AnalysisWatcherProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pendingRef = useRef<Pending[]>(readStore());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifiedRef = useRef<Set<string>>(new Set());

  const persist = useCallback(() => writeStore(pendingRef.current), []);

  const track = useCallback(
    (jobId: string, username: string) => {
      if (pendingRef.current.find((p) => p.jobId === jobId)) return;
      pendingRef.current.push({ jobId, username, startedAt: Date.now() });
      persist();
    },
    [persist],
  );

  const untrack = useCallback(
    (jobId: string) => {
      // Mark as already-notified so a stale poll cycle can't fire a late toast
      // (e.g. when the server pipeline marks the job 'error' but the client
      // fallback succeeds — we don't want a false "Analysis failed" toast).
      notifiedRef.current.add(jobId);
      const before = pendingRef.current.length;
      pendingRef.current = pendingRef.current.filter((p) => p.jobId !== jobId);
      if (pendingRef.current.length !== before) persist();
    },
    [persist],
  );

  const handleComplete = useCallback(
    async (p: Pending, status: "complete" | "error") => {
      if (notifiedRef.current.has(p.jobId)) return;
      notifiedRef.current.add(p.jobId);

      const isOk = status === "complete";
      const title = isOk
        ? t("notifications.analysisComplete", { username: p.username })
        : t("notifications.analysisFailed", { username: p.username });

      // Toast in-app
      const showToast = isOk ? toast.success : toast.error;
      showToast(title, {
        action: {
          label: t("notifications.viewAction"),
          onClick: () => navigate(`/dashboard/${p.username}`),
        },
      });

      // Browser notification
      showNotification(title, t("notifications.viewAction"), () => {
        window.focus();
        navigate(`/dashboard/${p.username}`);
      });

      // Persist as in-app notification
      if (user) {
        await supabase.from("notifications").insert({
          user_id: user.id,
          type: isOk ? "analysis_complete" : "analysis_failed",
          username: p.username,
        });
      }
    },
    [navigate, t, user],
  );

  useEffect(() => {
    if (!user) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }

    const poll = async () => {
      const pending = pendingRef.current;
      if (pending.length === 0) return;

      const ids = pending.map((p) => p.jobId);
      const { data } = await supabase
        .from("analysis_jobs")
        .select("id, status")
        .in("id", ids);

      if (!data) return;

      const stillPending: Pending[] = [];
      for (const p of pending) {
        const job = data.find((j) => j.id === p.jobId);
        if (!job) {
          // Job desapareció: drop tras 5 min de gracia
          if (Date.now() - p.startedAt > 5 * 60 * 1000) continue;
          stillPending.push(p);
          continue;
        }
        if (job.status === "complete" || job.status === "error") {
          await handleComplete(p, job.status as "complete" | "error");
        } else {
          stillPending.push(p);
        }
      }
      pendingRef.current = stillPending;
      persist();
    };

    // Run immediately + interval
    poll();
    intervalRef.current = setInterval(poll, POLL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, handleComplete, persist]);

  return <Ctx.Provider value={{ track, untrack }}>{children}</Ctx.Provider>;
}
