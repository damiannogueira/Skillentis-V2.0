
-- Job states enum
CREATE TYPE public.analysis_job_status AS ENUM ('queued', 'running', 'partial', 'complete', 'error');

-- Analysis jobs table
CREATE TABLE public.analysis_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  status analysis_job_status NOT NULL DEFAULT 'queued',
  progress INTEGER NOT NULL DEFAULT 0,
  message TEXT,
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Index for fast lookups by username
CREATE INDEX idx_analysis_jobs_username ON public.analysis_jobs (username, created_at DESC);

-- Enable RLS but allow public read/insert (no auth required per spec)
ALTER TABLE public.analysis_jobs ENABLE ROW LEVEL SECURITY;

-- Anyone can read jobs
CREATE POLICY "Public read access" ON public.analysis_jobs
  FOR SELECT TO anon, authenticated USING (true);

-- Anyone can insert jobs (queue new analyses)
CREATE POLICY "Public insert access" ON public.analysis_jobs
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Only service role can update (edge function uses service key)
CREATE POLICY "Service update access" ON public.analysis_jobs
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.analysis_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
