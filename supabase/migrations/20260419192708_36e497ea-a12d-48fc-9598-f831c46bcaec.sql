-- 1. Catálogo de badges
CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name_es text NOT NULL,
  name_en text NOT NULL,
  description_es text NOT NULL,
  description_en text NOT NULL,
  icon text NOT NULL,
  tier text NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze','silver','gold')),
  category text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges public read"
  ON public.badges FOR SELECT
  TO anon, authenticated
  USING (true);

-- 2. Logros desbloqueados por usuario
CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_code text NOT NULL REFERENCES public.badges(code) ON DELETE CASCADE,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_code)
);

CREATE INDEX idx_user_badges_user ON public.user_badges(user_id);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User badges public read"
  ON public.user_badges FOR SELECT
  TO anon, authenticated
  USING (true);

-- 3. Función para otorgar (idempotente, security definer para bypass de RLS desde triggers)
CREATE OR REPLACE FUNCTION public.award_badge(_user_id uuid, _badge_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _inserted boolean := false;
BEGIN
  INSERT INTO public.user_badges (user_id, badge_code)
  VALUES (_user_id, _badge_code)
  ON CONFLICT (user_id, badge_code) DO NOTHING;
  GET DIAGNOSTICS _inserted = ROW_COUNT;
  RETURN _inserted;
END;
$$;

-- 4. Función que evalúa todas las condiciones y otorga lo que corresponda
CREATE OR REPLACE FUNCTION public.check_and_award_badges(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _analysis_count int;
  _has_github text;
  _distinct_weeks int;
  _user_rank int;
  _top_codexa numeric;
BEGIN
  -- Contar análisis del usuario
  SELECT COUNT(*) INTO _analysis_count
  FROM public.analysis_usage WHERE user_id = _user_id;

  -- first_analysis
  IF _analysis_count >= 1 THEN
    PERFORM public.award_badge(_user_id, 'first_analysis');
  END IF;
  IF _analysis_count >= 10 THEN
    PERFORM public.award_badge(_user_id, 'ten_analyses');
  END IF;
  IF _analysis_count >= 50 THEN
    PERFORM public.award_badge(_user_id, 'fifty_analyses');
  END IF;

  -- Racha: 4 semanas distintas con actividad
  SELECT COUNT(DISTINCT date_trunc('week', analyzed_at)) INTO _distinct_weeks
  FROM public.analysis_usage
  WHERE user_id = _user_id
    AND analyzed_at > now() - interval '60 days';
  IF _distinct_weeks >= 4 THEN
    PERFORM public.award_badge(_user_id, 'weekly_streak');
  END IF;

  -- Perfil GitHub conectado
  SELECT github_username INTO _has_github
  FROM public.profiles WHERE id = _user_id;
  IF _has_github IS NOT NULL AND length(_has_github) > 0 THEN
    PERFORM public.award_badge(_user_id, 'github_connected');

    -- Ranking del usuario en analysis_jobs (su propio username analizado)
    WITH ranking AS (
      SELECT username, COUNT(*) AS cnt,
             RANK() OVER (ORDER BY COUNT(*) DESC) AS rnk
      FROM public.analysis_jobs
      WHERE status = 'complete'
      GROUP BY username
    )
    SELECT rnk INTO _user_rank FROM ranking WHERE lower(username) = lower(_has_github);

    IF _user_rank IS NOT NULL THEN
      IF _user_rank <= 10 THEN PERFORM public.award_badge(_user_id, 'top_10'); END IF;
      IF _user_rank <= 3  THEN PERFORM public.award_badge(_user_id, 'top_3'); END IF;
      IF _user_rank = 1   THEN PERFORM public.award_badge(_user_id, 'top_1'); END IF;
    END IF;

    -- Codexa Index 70+ (extraído del último resultado completo del username)
    SELECT (result->'metrics'->>'codexaIndex')::numeric INTO _top_codexa
    FROM public.analysis_jobs
    WHERE lower(username) = lower(_has_github) AND status = 'complete'
    ORDER BY completed_at DESC NULLS LAST
    LIMIT 1;
    IF _top_codexa IS NOT NULL AND _top_codexa >= 70 THEN
      PERFORM public.award_badge(_user_id, 'codexa_70');
    END IF;

    -- Veterano 5+ años en GitHub (yearsActive del último análisis)
    IF EXISTS (
      SELECT 1 FROM public.analysis_jobs
      WHERE lower(username) = lower(_has_github) AND status = 'complete'
        AND (result->>'yearsActive')::int >= 5
    ) THEN
      PERFORM public.award_badge(_user_id, 'veteran');
    END IF;
  END IF;
END;
$$;

-- 5. Trigger: cada nuevo análisis recalcula badges del usuario
CREATE OR REPLACE FUNCTION public.trg_check_badges_on_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.check_and_award_badges(NEW.user_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_badges_on_analysis_usage
AFTER INSERT ON public.analysis_usage
FOR EACH ROW
EXECUTE FUNCTION public.trg_check_badges_on_usage();

-- 6. Catálogo inicial (9 badges)
INSERT INTO public.badges (code, name_es, name_en, description_es, description_en, icon, tier, category, sort_order) VALUES
  ('first_analysis', 'Primer Análisis', 'First Analysis', 'Has realizado tu primer análisis', 'You ran your first analysis', 'Sparkles', 'bronze', 'activity', 10),
  ('ten_analyses', '10 Análisis', '10 Analyses', 'Has realizado 10 análisis', 'You ran 10 analyses', 'Activity', 'silver', 'activity', 20),
  ('fifty_analyses', '50 Análisis', '50 Analyses', 'Has realizado 50 análisis', 'You ran 50 analyses', 'Flame', 'gold', 'activity', 30),
  ('weekly_streak', 'Racha Semanal', 'Weekly Streak', '4 semanas seguidas con actividad', '4 weeks in a row with activity', 'Calendar', 'silver', 'consistency', 40),
  ('github_connected', 'Perfil Conectado', 'Connected Profile', 'Has conectado tu cuenta de GitHub', 'You linked your GitHub account', 'Github', 'bronze', 'profile', 50),
  ('top_10', 'Top 10', 'Top 10', 'Estás en el Top 10 del ranking', 'You are in the leaderboard Top 10', 'Trophy', 'bronze', 'ranking', 60),
  ('top_3', 'Top 3', 'Top 3', 'Estás en el Top 3 del ranking', 'You are in the leaderboard Top 3', 'Trophy', 'silver', 'ranking', 70),
  ('top_1', 'Número 1', 'Number 1', 'Eres el #1 del ranking', 'You are #1 in the leaderboard', 'Crown', 'gold', 'ranking', 80),
  ('codexa_70', 'Codexa 70+', 'Codexa 70+', 'Tu Índice Codexa supera los 70 puntos', 'Your Codexa Index is above 70', 'Star', 'gold', 'achievement', 90),
  ('veteran', 'Veterano', 'Veteran', '5+ años de actividad en GitHub', '5+ years active on GitHub', 'Award', 'silver', 'achievement', 100);