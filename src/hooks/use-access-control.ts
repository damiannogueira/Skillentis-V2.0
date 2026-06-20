import { useAuth } from "./use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

export interface AccessLimits {
  canAnalyze: boolean;
  canCompare: boolean;
  canViewPublicProfile: boolean;
  canBulkAnalyze: boolean;
  monthlyUsed: number;
  monthlyLimit: number | null; // null = unlimited
  role: string;
  isAuthenticated: boolean;
}

export function useAccessControl(): AccessLimits {
  const { user, role } = useAuth();
  const [monthlyUsed, setMonthlyUsed] = useState(0);

  useEffect(() => {
    if (!user) return;
    
    supabase.rpc("get_monthly_analysis_count", { _user_id: user.id })
      .then(({ data }) => {
        if (data !== null) setMonthlyUsed(data);
      });
  }, [user]);

  const isPro = role === "pro" || role === "pro_recruiter";
  const limit = isPro ? null : 1;
  const displayUsed = limit !== null ? Math.min(monthlyUsed, limit) : monthlyUsed;

  return {
    canAnalyze: !user ? false : isPro ? true : monthlyUsed < 1,
    canCompare: isPro,
    canViewPublicProfile: isPro,
    canBulkAnalyze: role === "pro_recruiter",
    monthlyUsed: displayUsed,
    monthlyLimit: limit,
    role,
    isAuthenticated: !!user,
  };
}

// Demo profiles do not consume the user's monthly Free quota.
// (Quota resets automatically each month because counts filter by to_char(now(), 'YYYY-MM').)
const DEMO_USERNAMES = new Set(["torvalds"]);

export function isDemoAnalysis(username: string | undefined | null): boolean {
  if (!username) return false;
  return DEMO_USERNAMES.has(username.trim().toLowerCase());
}

export async function recordAnalysisUsage(userId: string, username: string) {
  // Skip demo profiles so viewing Linus Torvalds (or other demos) never burns a Free user's monthly slot.
  if (isDemoAnalysis(username)) return;
  // Idempotent: unique index (user_id, lower(username), month) prevents duplicates within the same month.
  // The `month` column defaults to to_char(now(), 'YYYY-MM') server-side, so quota auto-resets monthly.
  await supabase.from("analysis_usage").insert({
    user_id: userId,
    username_analyzed: username,
  });
}
