import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export interface BadgeDef {
  code: string;
  name_es: string;
  name_en: string;
  description_es: string;
  description_en: string;
  icon: string;
  tier: "bronze" | "silver" | "gold";
  category: string;
  sort_order: number;
}

export interface UserBadge {
  badge_code: string;
  awarded_at: string;
}

export interface BadgeWithStatus extends BadgeDef {
  earned: boolean;
  awarded_at?: string;
}

const SEEN_KEY_PREFIX = "skillentis_seen_badges_";

export const useBadges = (userId?: string | null) => {
  const [catalog, setCatalog] = useState<BadgeDef[]>([]);
  const [earned, setEarned] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, i18n } = useTranslation();

  const load = useCallback(async () => {
    setLoading(true);
    const [catRes, earnedRes] = await Promise.all([
      supabase.from("badges").select("*").order("sort_order"),
      userId
        ? supabase.from("user_badges").select("badge_code, awarded_at").eq("user_id", userId)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (catRes.data) setCatalog(catRes.data as BadgeDef[]);
    if (earnedRes.data) setEarned(earnedRes.data as UserBadge[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  // Detect newly unlocked badges and toast
  useEffect(() => {
    if (!userId || earned.length === 0 || catalog.length === 0) return;
    const seenKey = SEEN_KEY_PREFIX + userId;
    const seen: string[] = JSON.parse(localStorage.getItem(seenKey) || "[]");
    const codes = earned.map((e) => e.badge_code);
    const newly = codes.filter((c) => !seen.includes(c));
    if (newly.length > 0) {
      newly.forEach((code) => {
        const def = catalog.find((b) => b.code === code);
        if (!def) return;
        const lang = i18n.language.startsWith("es") ? "es" : "en";
        toast.success(t("badges.unlocked"), {
          description: lang === "es" ? def.name_es : def.name_en,
          duration: 5000,
        });
      });
      localStorage.setItem(seenKey, JSON.stringify(codes));
    }
  }, [earned, catalog, userId, i18n.language, t]);

  const merged: BadgeWithStatus[] = catalog.map((b) => {
    const e = earned.find((x) => x.badge_code === b.code);
    return { ...b, earned: !!e, awarded_at: e?.awarded_at };
  });

  return { badges: merged, earned, catalog, loading, refresh: load };
};

// For displaying badges of any user (public profile, leaderboard)
export const useUserBadges = (userId?: string | null) => {
  const [badges, setBadges] = useState<BadgeWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setBadges([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [catRes, earnedRes] = await Promise.all([
        supabase.from("badges").select("*").order("sort_order"),
        supabase.from("user_badges").select("badge_code, awarded_at").eq("user_id", userId),
      ]);
      if (cancelled) return;
      const cat = (catRes.data || []) as BadgeDef[];
      const earnedRows = (earnedRes.data || []) as UserBadge[];
      const merged = cat
        .map((b) => {
          const e = earnedRows.find((x) => x.badge_code === b.code);
          return { ...b, earned: !!e, awarded_at: e?.awarded_at };
        })
        .filter((b) => b.earned);
      setBadges(merged);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  return { badges, loading };
};

// Resolve user_id from github_username (for public profiles)
export const useUserIdByGithub = (githubUsername?: string) => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!githubUsername) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .ilike("github_username", githubUsername)
        .maybeSingle();
      setUserId(data?.id ?? null);
    })();
  }, [githubUsername]);

  return userId;
};
