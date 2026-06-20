import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MyAnalysis {
  username: string;
  analyzed_at: string;
}

export function useMyAnalyses(userId: string | undefined, limit = 10) {
  const [items, setItems] = useState<MyAnalysis[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setItems([]);
      return;
    }
    setLoading(true);
    supabase
      .from("analysis_usage")
      .select("username_analyzed, analyzed_at")
      .eq("user_id", userId)
      .order("analyzed_at", { ascending: false })
      .limit(limit)
      .then(({ data }) => {
        const seen = new Set<string>();
        const unique: MyAnalysis[] = [];
        (data ?? []).forEach((row) => {
          const key = row.username_analyzed.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            unique.push({ username: row.username_analyzed, analyzed_at: row.analyzed_at });
          }
        });
        setItems(unique);
        setLoading(false);
      });
  }, [userId, limit]);

  const remove = useCallback(
    async (username: string) => {
      if (!userId) return { error: new Error("not-authenticated") };
      const { error } = await supabase
        .from("analysis_usage")
        .delete()
        .eq("user_id", userId)
        .ilike("username_analyzed", username);
      if (!error) {
        setItems((prev) => prev.filter((i) => i.username.toLowerCase() !== username.toLowerCase()));
      }
      return { error };
    },
    [userId]
  );

  return { items, loading, remove };
}
