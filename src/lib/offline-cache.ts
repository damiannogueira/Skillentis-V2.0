import { type AnalysisResult } from "@/lib/analysis-engine";

const CACHE_PREFIX = "skillentis_cache_";

export function cacheAnalysis(username: string, result: AnalysisResult) {
  try {
    localStorage.setItem(
      `${CACHE_PREFIX}${username.toLowerCase()}`,
      JSON.stringify({ result, cachedAt: Date.now() })
    );
  } catch {
    // Storage full — silently fail
  }
}

export function getCachedAnalysis(username: string): { result: AnalysisResult; cachedAt: number } | null {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${username.toLowerCase()}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
