import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllGitHubData } from "@/lib/github-api";
import { analyzeGitHubData, type AnalysisResult } from "@/lib/analysis-engine";
import { requestNotificationPermission, showNotification } from "@/lib/notifications";
import { cacheAnalysis, getCachedAnalysis } from "@/lib/offline-cache";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useAnalysisWatcher } from "@/hooks/use-analysis-watcher";

type JobStatus = "queued" | "running" | "partial" | "complete" | "error";

interface JobState {
  status: JobStatus;
  progress: number;
  message: string | null;
}

export function useGitHubAnalysis(username: string | undefined) {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cachedAt, setCachedAt] = useState<number | undefined>();
  const isOnline = useOnlineStatus();
  const { track, untrack } = useAnalysisWatcher();
  const [jobState, setJobState] = useState<JobState>({
    status: "queued",
    progress: 0,
    message: null,
  });

  const runClientFallback = useCallback(async (user: string) => {
    setJobState({ status: "running", progress: 30, message: "Fetching GitHub data..." });
    const dataset = await fetchAllGitHubData(user);
    setJobState({ status: "partial", progress: 70, message: "Computing evolution signals..." });
    const analysis = analyzeGitHubData(dataset);
    setJobState({ status: "complete", progress: 100, message: "Analysis complete" });
    return analysis;
  }, []);

  useEffect(() => {
    if (!username) {
      setError("No username provided");
      setLoading(false);
      return;
    }

    // Offline: serve cached data immediately
    if (!isOnline) {
      const cached = getCachedAnalysis(username);
      if (cached) {
        setResult(cached.result);
        setCachedAt(cached.cachedAt);
        setJobState({ status: "complete", progress: 100, message: "Loaded from cache" });
        setLoading(false);
      } else {
        setError("Sin conexión y sin datos en caché para este usuario");
        setLoading(false);
      }
      return;
    }

    let cancelled = false;
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    setLoading(true);
    setError(null);
    setCachedAt(undefined);
    setJobState({ status: "queued", progress: 5, message: "Starting analysis..." });

    // Request notification permission early
    requestNotificationPermission();

    const notifyComplete = (user: string) => {
      showNotification(
        "✅ Análisis completado",
        `El perfil de evolución de ${user} está listo.`,
        () => window.focus()
      );
    };

    const startPipeline = async () => {
      try {
        // Try server pipeline first
        const { data, error: invokeError } = await supabase.functions.invoke(
          "analyze-pipeline",
          { body: { username } }
        );

        if (invokeError || !data?.jobId) {
          // Fallback to client-side analysis
          console.info("Pipeline unavailable, using client-side analysis");
          const analysis = await runClientFallback(username);
          if (!cancelled) {
            setResult(analysis);
            cacheAnalysis(username, analysis);
            setLoading(false);
            notifyComplete(username);
          }
          return;
        }

        const jobId = data.jobId;
        track(jobId, username);

        // Poll job status
        const pollJob = async () => {
          const { data: job } = await supabase
            .from("analysis_jobs")
            .select("status, progress, message, result, error_message")
            .eq("id", jobId)
            .single();

          if (cancelled || !job) return;

          setJobState({
            status: job.status as JobStatus,
            progress: job.progress || 0,
            message: job.message,
          });

          if (job.status === "complete" && job.result) {
            if (pollInterval) clearInterval(pollInterval);
            setResult(job.result as unknown as AnalysisResult);
            cacheAnalysis(username, job.result as unknown as AnalysisResult);
            setLoading(false);
            notifyComplete(username);
          } else if (job.status === "error") {
            if (pollInterval) clearInterval(pollInterval);
            // Fallback to client-side on server error
            try {
              const analysis = await runClientFallback(username);
              if (!cancelled) {
                // Server marked the job as 'error', but the client rescued the analysis.
                // Untrack so the AnalysisWatcher doesn't fire a false "Analysis failed" toast.
                untrack(jobId);
                setResult(analysis);
                cacheAnalysis(username, analysis);
                setLoading(false);
                notifyComplete(username);
              }
            } catch (fallbackErr) {
              if (!cancelled) {
                setError(job.error_message || "Analysis failed");
                setLoading(false);
              }
            }
          }
        };

        // Start polling every 1.5s
        pollInterval = setInterval(pollJob, 1500);
        // Also poll immediately
        await pollJob();

        // Timeout after 60s — fallback to client
        setTimeout(async () => {
          if (cancelled || !loading) return;
          if (pollInterval) clearInterval(pollInterval);
          try {
            const analysis = await runClientFallback(username);
            if (!cancelled) {
              // Pipeline timed out but client rescued — silence the watcher for this job.
              untrack(jobId);
              setResult(analysis);
              cacheAnalysis(username, analysis);
              setLoading(false);
              notifyComplete(username);
            }
          } catch {
            if (!cancelled) {
              setError("Analysis timed out");
              setLoading(false);
            }
          }
        }, 60000);

      } catch {
        // Full fallback to client-side
        try {
          const analysis = await runClientFallback(username);
          if (!cancelled) {
            setResult(analysis);
            cacheAnalysis(username, analysis);
            setLoading(false);
            notifyComplete(username);
          }
        } catch (err) {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : "Failed to analyze");
            setLoading(false);
          }
        }
      }
    };

    startPipeline();

    return () => {
      cancelled = true;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [username, isOnline, runClientFallback]);

  return { result, loading, error, jobState, cachedAt };
}
