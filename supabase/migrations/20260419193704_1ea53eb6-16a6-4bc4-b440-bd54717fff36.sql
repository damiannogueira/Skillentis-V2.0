-- Deduplicate analysis_usage: keep oldest per (user_id, username_analyzed, month)
DELETE FROM public.analysis_usage a
USING public.analysis_usage b
WHERE a.user_id = b.user_id
  AND lower(a.username_analyzed) = lower(b.username_analyzed)
  AND a.month = b.month
  AND a.analyzed_at > b.analyzed_at;

-- Add unique constraint to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS analysis_usage_unique_per_month
ON public.analysis_usage (user_id, lower(username_analyzed), month);