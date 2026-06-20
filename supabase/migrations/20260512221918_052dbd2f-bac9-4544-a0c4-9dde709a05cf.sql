-- 1. Add user_id ownership column to analysis_jobs
ALTER TABLE public.analysis_jobs ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_user_id ON public.analysis_jobs(user_id);

-- 2. Replace INSERT policy: authenticated users tied to auth.uid(), or anon for torvalds demo
DROP POLICY IF EXISTS "Public insert queued only" ON public.analysis_jobs;

CREATE POLICY "Authenticated insert own queued jobs"
ON public.analysis_jobs FOR INSERT TO authenticated
WITH CHECK (
  status = 'queued'::analysis_job_status
  AND result IS NULL
  AND user_id = auth.uid()
);

CREATE POLICY "Anon insert torvalds demo only"
ON public.analysis_jobs FOR INSERT TO anon
WITH CHECK (
  status = 'queued'::analysis_job_status
  AND result IS NULL
  AND user_id IS NULL
  AND lower(username) = 'torvalds'
);

-- 3. Realtime: deny direct subscriptions to broadcast/presence channels.
-- The app uses postgres_changes on tables with RLS, which already filters server-side.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Deny realtime broadcast/presence subscriptions" ON realtime.messages;
CREATE POLICY "Deny realtime broadcast/presence subscriptions"
ON realtime.messages FOR SELECT TO authenticated, anon
USING (false);

-- 4. Revoke EXECUTE on internal SECURITY DEFINER functions from anon/authenticated.
-- Keep client-callable RPCs accessible (get_monthly_analysis_count, has_active_subscription, get_profile_visibility).
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.award_badge(uuid, text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_and_award_badges(uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_check_badges_on_usage() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, PUBLIC;