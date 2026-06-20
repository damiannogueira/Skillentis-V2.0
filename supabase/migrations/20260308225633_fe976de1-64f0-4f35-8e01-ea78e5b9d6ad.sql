
-- Fix function search path
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Drop overly permissive update policy and restrict to service_role only
DROP POLICY IF EXISTS "Service update access" ON public.analysis_jobs;
DROP POLICY IF EXISTS "Public insert access" ON public.analysis_jobs;

-- Insert: anyone can queue but only with status 'queued' and no result
CREATE POLICY "Public insert queued only" ON public.analysis_jobs
  FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'queued' AND result IS NULL);
